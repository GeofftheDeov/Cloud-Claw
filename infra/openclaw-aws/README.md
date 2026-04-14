# Cloud-Claw AWS Terraform

Terraform scaffold for running OpenClaw on AWS with:
- ECR
- ECS Fargate
- EFS
- CloudWatch Logs
- VPC deployment (private subnets preferred; default/public subnet bootstrap supported)

## Defaults

- Region: `us-east-2`
- Environment: `prod`
- Service: `cloud-claw-service`
- Container port: `18789`

## Important security model

This repo is intended to be public.

That means:
- do **not** commit secrets
- do **not** commit `*.tfvars`
- store runtime secrets in **AWS Secrets Manager**
- store GitHub deployment credentials and identifiers in **GitHub Environment Secrets**

Terraform references only **Secrets Manager ARNs**, not raw secret values.

## Required AWS-side inputs

You need an existing:
- VPC
- at least 2 private subnets in the target region
- route/NAT/pathing that lets Fargate reach ECR, CloudWatch, and Secrets Manager

You also need these Secrets Manager secrets created:
- OpenClaw gateway token
- Discord bot token
- OpenAI API key
- optional Gemini API key

## Suggested Secrets Manager names

- `cloud-claw/prod/openclaw-gateway-token`
- `cloud-claw/prod/discord-token`
- `cloud-claw/prod/openai-api-key`
- `cloud-claw/prod/gemini-api-key`

## Required GitHub Environment Secrets

Create GitHub environment: `prod`

Set these environment secrets:
- `AWS_ROLE_TO_ASSUME`
- `VPC_ID`
- `PRIVATE_SUBNET_IDS_JSON`
- `ALLOWED_CIDR_BLOCKS_JSON`
- `OPENCLAW_GATEWAY_TOKEN_SECRET_ARN`
- `DISCORD_TOKEN_SECRET_ARN`
- `OPENAI_API_KEY_SECRET_ARN`
- `GEMINI_API_KEY_SECRET_ARN`

Example JSON values:
- `PRIVATE_SUBNET_IDS_JSON` -> `["subnet-abc","subnet-def"]`
- `ALLOWED_CIDR_BLOCKS_JSON` -> `["10.0.0.0/16"]`

## GitHub Actions flow

The workflow:
1. assumes an AWS role via GitHub OIDC
2. runs Terraform apply
3. gets the ECR repo URL from Terraform outputs
4. builds and pushes the Docker image
5. forces a new ECS deployment

## Local usage

Example:

```bash
terraform init
terraform plan \
  -var='vpc_id=vpc-xxxxxxxx' \
  -var='private_subnet_ids=["subnet-a","subnet-b"]' \
  -var='allowed_cidr_blocks=["10.0.0.0/16"]' \
  -var='gateway_token_secret_arn=arn:aws:secretsmanager:...:secret:cloud-claw/prod/openclaw-gateway-token' \
  -var='discord_token_secret_arn=arn:aws:secretsmanager:...:secret:cloud-claw/prod/discord-token' \
  -var='openai_api_key_secret_arn=arn:aws:secretsmanager:...:secret:cloud-claw/prod/openai-api-key'
```

## Follow-up items I recommend

Before first deploy, confirm:
- the OpenClaw image/Dockerfile you want to build
- the exact runtime env var names expected by the gateway config
- whether you want an internal ALB next
- whether you want a dedicated Terraform state backend (recommended: S3 + DynamoDB or native lockfile support)
