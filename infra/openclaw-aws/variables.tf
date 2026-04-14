variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-2"
}

variable "name_prefix" {
  description = "Prefix for created AWS resources"
  type        = string
  default     = "cloud-claw"
}

variable "container_port" {
  description = "OpenClaw gateway container port"
  type        = number
  default     = 18789
}

variable "cpu" {
  description = "Fargate task CPU units"
  type        = number
  default     = 1024
}

variable "memory" {
  description = "Fargate task memory in MiB"
  type        = number
  default     = 2048
}

variable "desired_count" {
  description = "Desired ECS service task count"
  type        = number
  default     = 1
}

variable "vpc_id" {
  description = "Existing VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for ECS tasks and EFS mount targets"
  type        = list(string)
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to reach the gateway privately"
  type        = list(string)
  default     = []
}

variable "image_tag" {
  description = "Container image tag to deploy from ECR"
  type        = string
  default     = "latest"
}

variable "environment_name" {
  description = "Logical deployment environment name"
  type        = string
  default     = "prod"
}

variable "gateway_token_secret_arn" {
  description = "Secrets Manager ARN containing OPENCLAW_GATEWAY_TOKEN"
  type        = string
}

variable "discord_token_secret_arn" {
  description = "Secrets Manager ARN containing the Discord bot token"
  type        = string
}

variable "openai_api_key_secret_arn" {
  description = "Secrets Manager ARN containing OPENAI_API_KEY"
  type        = string
}

variable "gemini_api_key_secret_arn" {
  description = "Optional Secrets Manager ARN containing GEMINI_API_KEY"
  type        = string
  default     = ""
}
