# Walkthrough: Claude in the Cloud

I have successfully initialized your new project, **Claude in the Cloud**. This project provides a persistent, containerized Claude agent running on AWS ECS Fargate with a high-end, private dashboard for monitoring.

## Key Accomplishments

### 1. Persistent 24/7 Backend
Created a Node.js/TypeScript backend that wraps the Anthropic SDK. It includes a health check and a chat endpoint, designed to stay running 24/7 in an AWS container.
- [backend/src/index.ts](file:///c:/Users/Geoffrey/Documents/GitHub/claude-in-the-cloud/backend/src/index.ts)
- [backend/Dockerfile](file:///c:/Users/Geoffrey/Documents/GitHub/claude-in-the-cloud/backend/Dockerfile)

### 2. Premium Next.js Dashboard
Designed a sleek, dark-mode dashboard with **glassmorphism** and **neon accents**. The dashboard tracks system health (simulated) and provides a direct interface to talk to the agent in the cloud.
- [frontend/src/app/page.tsx](file:///c:/Users/Geoffrey/Documents/GitHub/claude-in-the-cloud/frontend/src/app/page.tsx)
- [frontend/src/app/globals.css](file:///c:/Users/Geoffrey/Documents/GitHub/claude-in-the-cloud/frontend/src/app/globals.css)

### 3. Terraform Infrastructure (IaC)
Implemented a complete AWS infrastructure stack using **Terraform (HCL)**. This provisions a secure VPC, ECS Cluster, Fargate Service, and the necessary IAM roles.
- [terraform/main.tf](file:///c:/Users/Geoffrey/Documents/GitHub/claude-in-the-cloud/terraform/main.tf)
- [terraform/variables.tf](file:///c:/Users/Geoffrey/Documents/GitHub/claude-in-the-cloud/terraform/variables.tf)

## How to Deploy

> [!IMPORTANT]
> **Prerequisites**: Ensure you have the [AWS CLI](https://aws.amazon.com/cli/) and [Terraform](https://www.terraform.io/) installed locally.

### Step 1: Build & Bash Images
1. Create an ECR repository in your AWS console.
2. Build and push the backend image:
   ```bash
   cd backend
   docker build -t claude-backend .
   # Tag and push to ECR (instructions available in the AWS ECR console)
   ```

### Step 2: Initialize Infrastructure
1. Navigate to the terraform directory:
   ```bash
   cd terraform
   terraform init
   ```
2. Deploy the stack (you will need your Anthropic API Key and ECR URL):
   ```bash
   terraform apply -var="anthropic_api_key=your_key" -var="ecr_repository_url=your_ecr_url"
   ```

### Step 3: Run the Dashboard
The dashboard can be run locally or deployed as a static site. To run locally:
```bash
cd frontend
npm install
npm run dev
```

## Security Note
The current Terraform setup places the ECS service in a public subnet with a security group that allows traffic on port `3001`. For maximum privacy, you should update the `cidr_blocks` in [main.tf](file:///c:/Users/Geoffrey/Documents/GitHub/claude-in-the-cloud/terraform/main.tf) to only include your specific IP address.
