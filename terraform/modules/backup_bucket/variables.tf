variable "bucket_name" {
  description = "Globally unique bucket name."
  type        = string
}

variable "retention_days" {
  description = "Days before a dump, or an old version of one, is deleted."
  type        = number
}

variable "force_destroy" {
  description = "Let terraform destroy delete a bucket that still holds dumps."
  type        = bool
}
