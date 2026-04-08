pipeline {
    agent any
    options { timestamps() }

    environment {
        DOCKER_BUILDKIT = '1'
        COMPOSE_DOCKER_CLI_BUILD = '1'
        CONTAINER_NAME = 'amoora-inventory-app'
        COMPOSE_FILE = "${WORKSPACE}/docker-compose.yml"
    }

    stages {
        stage('Prepare') {
            steps {
                sh '''
                    set -e
                    mkdir -p deploy-logs
                    docker compose version
                    ls -la "${COMPOSE_FILE}"
                '''
            }
        }

        stage('Build & Deploy') {
            steps {
                sh '''
                    set -e
                    docker compose -f "${COMPOSE_FILE}" down --remove-orphans || true
                    docker compose -f "${COMPOSE_FILE}" build --pull
                    docker compose -f "${COMPOSE_FILE}" up -d
                    docker compose -f "${COMPOSE_FILE}" ps
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    set -e
                    i=0
                    while [ $i -lt 30 ]; do
                        STATUS=$(docker inspect --format='{{.State.Health.Status}}' "${CONTAINER_NAME}" 2>/dev/null || echo "unknown")
                        echo "Attempt $((i+1)): ${STATUS}"
                        [ "${STATUS}" = "healthy" ] && exit 0
                        sleep 5; i=$((i+1))
                    done
                    docker logs "${CONTAINER_NAME}" --tail=200 || true
                    exit 1
                '''
            }
        }
    }

    post {
        always {
            sh '''
                set -e
                mkdir -p deploy-logs
                docker compose -f "${COMPOSE_FILE}" ps > deploy-logs/compose-ps.txt 2>/dev/null || true
                docker logs "${CONTAINER_NAME}" --since=30m > "deploy-logs/${CONTAINER_NAME}.log" 2>/dev/null || true
            '''
            archiveArtifacts artifacts: 'deploy-logs/**', onlyIfSuccessful: false
        }
    }
}
