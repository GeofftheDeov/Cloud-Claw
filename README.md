# Cloud-Claw

Infrastructure scaffold for running OpenClaw on AWS ECS Fargate with EFS-backed persistent storage.

## Included

- `infra/openclaw-aws/` Terraform for ECR, ECS, EFS, CloudWatch, and networking hooks
- `.github/workflows/deploy.yml` GitHub Actions deploy pipeline using environment secrets

## Defaults

- Repo name: `Cloud-Claw`
- GitHub environment: `prod`
- AWS region: `us-east-2`

## Notes

This repo is designed to stay public **without** exposing secrets.
All secrets should live in GitHub environment secrets and/or AWS Secrets Manager.
