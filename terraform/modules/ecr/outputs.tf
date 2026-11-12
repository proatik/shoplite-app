output "repository_urls" {
  description = "Image repository URL per application."
  value       = { for name, repository in aws_ecr_repository.this : name => repository.repository_url }
}

output "repository_arns" {
  description = "Repository ARNs, for pull permissions."
  value       = [for repository in aws_ecr_repository.this : repository.arn]
}

output "github_provider_arn" {
  description = "GitHub's OIDC provider, which other CI roles trust too."
  value       = local.github_provider_arn
}

output "ci_role_arn" {
  description = "Role GitHub Actions assumes through OIDC to push images."
  value       = aws_iam_role.ci.arn
}
