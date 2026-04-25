terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# --- VPC & Networking ---
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = { Name = "cloudclaw-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags                    = { Name = "cloudclaw-public-${count.index}" }
}

data "aws_availability_zones" "available" {}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# --- ECR Repository ---
resource "aws_ecr_repository" "app" {
  name                 = "cloud-claw"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

# --- ECS Cluster ---
resource "aws_ecs_cluster" "main" {
  name = "cloud-claw-cluster"
}

# --- CloudWatch Logs ---
resource "aws_cloudwatch_log_group" "claude_logs" {
  name              = "/ecs/cloudclaw"
  retention_in_days = 7
}

# --- IAM Roles ---
resource "aws_iam_role" "ecs_execution" {
  name = "cloudclaw_ecs_execution_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_standard" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name = "cloudclaw_ecs_task_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_policy" "ecs_task_efs" {
  name = "cloudclaw_ecs_task_efs_policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "elasticfilesystem:ClientMount",
        "elasticfilesystem:ClientWrite",
        "elasticfilesystem:ClientRootAccess"
      ]
      Resource = aws_efs_file_system.cloudclaw_data.arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_efs_attach" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = aws_iam_policy.ecs_task_efs.arn
}

# --- EFS File System ---
resource "aws_efs_file_system" "cloudclaw_data" {
  creation_token = "cloudclaw-skills-efs"
  encrypted      = true
  tags           = { Name = "cloudclaw-skills-efs" }
}

resource "aws_security_group" "efs_sg" {
  name        = "cloudclaw-efs-sg"
  vpc_id      = aws_vpc.main.id
  description = "Allow NFS traffic from ECS tasks"

  ingress {
    protocol        = "tcp"
    from_port       = 2049
    to_port         = 2049
    security_groups = [aws_security_group.ecs_tasks.id]
  }
}

resource "aws_efs_mount_target" "cloudclaw_data" {
  count           = 2
  file_system_id  = aws_efs_file_system.cloudclaw_data.id
  subnet_id       = aws_subnet.public[count.index].id
  security_groups = [aws_security_group.efs_sg.id]
}

# --- Security Groups ---
resource "aws_security_group" "ecs_tasks" {
  name        = "cloudclaw-ecs-tasks-sg"
  vpc_id      = aws_vpc.main.id
  description = "Allow outbound traffic for CloudClaw service"

  egress {
    protocol    = "tcp"
    from_port   = 0
    to_port     = 65535
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- ECS Fargate Service ---
resource "aws_ecs_task_definition" "app" {
  family                   = "cloud-claw"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  volume {
    name = "cloudclaw-skills-volume"
    efs_volume_configuration {
      file_system_id     = aws_efs_file_system.cloudclaw_data.id
      transit_encryption = "ENABLED"
    }
  }

  container_definitions = jsonencode([{
    name      = "cloud-claw-backend"
    image     = "${aws_ecr_repository.app.repository_url}:latest"
    essential = true

    mountPoints = [{
      sourceVolume  = "cloudclaw-skills-volume"
      containerPath = "/workspace/cloudclaw-skills"
      readOnly      = false
    }]

    environment = [
      { name = "ANTHROPIC_API_KEY", value = var.anthropic_api_key },
      { name = "ALPACA_API_KEY", value = var.alpaca_api_key },
      { name = "ALPACA_SECRET_KEY", value = var.alpaca_secret_key },
      { name = "DISCORD_TOKEN", value = var.discord_token }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.claude_logs.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

resource "aws_ecs_service" "main" {
  name            = "cloud-claw-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks.id]
    subnets          = aws_subnet.public[*].id
    assign_public_ip = true
  }
}
