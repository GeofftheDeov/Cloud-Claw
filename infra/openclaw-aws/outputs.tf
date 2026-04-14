output "ecr_repository_url" {
  value       = aws_ecr_repository.this.repository_url
  description = "ECR repository URL"
}

output "ecs_cluster_name" {
  value       = aws_ecs_cluster.this.name
  description = "ECS cluster name"
}

output "ecs_service_name" {
  value       = aws_ecs_service.this.name
  description = "ECS service name"
}

output "efs_file_system_id" {
  value       = aws_efs_file_system.this.id
  description = "EFS file system ID"
}

output "cloudwatch_log_group" {
  value       = aws_cloudwatch_log_group.this.name
  description = "CloudWatch log group name"
}
