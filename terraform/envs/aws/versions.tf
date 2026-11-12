terraform {
  required_version = "~> 1.17"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.71.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "2.9.1"
    }
  }

  backend "s3" {
    key          = "shoplite/aws.tfstate"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      project     = "shoplite"
      environment = var.environment
      managed-by  = "terraform"
    }
  }
}
