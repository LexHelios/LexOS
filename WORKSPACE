workspace(name = "lexos")

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

# Rules for building Docker images
http_archive(
    name = "io_bazel_rules_docker",
    sha256 = "b1e80761a8a8243d03ebca8845e9ccb869a2a5f109bc5a0c3f0f8c1c2c0c0c0",
    strip_prefix = "rules_docker-0.25.0",
    urls = ["https://github.com/bazelbuild/rules_docker/releases/download/v0.25.0/rules_docker-v0.25.0.tar.gz"],
)

load(
    "@io_bazel_rules_docker//repositories:repositories.bzl",
    container_repositories = "repositories",
)

container_repositories()

load("@io_bazel_rules_docker//repositories:deps.bzl", container_deps = "deps")

container_deps()

load(
    "@io_bazel_rules_docker//container:container.bzl",
    "container_pull",
)

# Pull the base image
container_pull(
    name = "python_base",
    registry = "index.docker.io",
    repository = "python",
    tag = "3.11.5-alpine",
) 