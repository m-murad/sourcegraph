#!/usr/bin/env bash

set -e

echo "--- yarn in root"
yarn --frozen-lockfile --network-timeout 60000

cd $1
echo "--- test"
# 4 matches the CPU limits in
# infrastructure/kubernetes/ci/buildkite/buildkite-agent/buildkite-agent.Deployment.yaml
yarn -s run test --maxWorkers 4
