output "vpc_id" {
  value = aws_vpc.main.id
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "service_name" {
  value = aws_ecs_service.main.name
}

output "cloudwatch_log_group" {
  value = aws_cloudwatch_log_group.claude_logs.name
}
output "ecr_repository_url" {
  value = aws_ecr_repository.app.repository_url
}
