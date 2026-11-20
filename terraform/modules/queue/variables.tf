variable "name" {
  description = "Prefix for every resource name."
  type        = string
}

variable "lambda_source_dir" {
  description = "Folder with the order-confirmation handler, packaged as the function code."
  type        = string
}
