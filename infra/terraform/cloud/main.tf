provider "aws" {
  region = "ap-southeast-1"
}

resource "aws_instance" "gpu_node" {
  ami           = "ami-gpu-ubuntu-22" # placeholder for actual GPU AMI
  instance_type = "g5.xlarge"       # NVIDIA A10G GPU instance

  root_block_device {
    volume_size = 200
    volume_type = "gp3"
  }

  tags = {
    Name        = "khulnasoft-gpu-node"
    Project     = "AI Grid"
    Environment = "production"
  }
}

# Output the IP address for Ansible usage
output "gpu_node_ip" {
  value = aws_instance.gpu_node.public_ip
}
