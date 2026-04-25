variable "aws_region" {
  description = "AWS region to deploy to"
  type        = string
  default     = "us-east-1"
}

variable "anthropic_api_key" {
  description = "Anthropic API Key for Claude"
  type        = string
  sensitive   = true
}

variable "alpaca_api_key" {
  description = "Alpaca API Key ID"
  type        = string
  sensitive   = true
}

variable "alpaca_secret_key" {
  description = "Alpaca API Secret Key"
  type        = string
  sensitive   = true
}

variable "discord_token" {
  description = "Discord Bot Token for OpenClaw"
  type        = string
  sensitive   = true
}

variable "ecr_repository_url" {
  description = "URL of the ECR repository containing the OpenClaw image"
  type        = string
}
