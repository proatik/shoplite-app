variable "name" {
  description = "Repository namespace and prefix for the CI role."
  type        = string
}

variable "repositories" {
  description = "One repository per application image."
  type        = list(string)
}

variable "keep_images" {
  description = "Images kept per repository; older ones expire."
  type        = number
}

variable "force_delete" {
  description = "Let terraform destroy delete repositories that still hold images."
  type        = bool
}

variable "github_repository" {
  description = "owner/name of the repository whose main branch may push images."
  type        = string
}

variable "create_github_oidc_provider" {
  description = "Create GitHub's OIDC provider; false when the account already has one."
  type        = bool
}
