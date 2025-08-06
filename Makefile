build:
	docker build -t darellyuhu/sento-backend-staging:latest -f docker/staging/Dockerfile .

compose-down: 
	docker compose -f compose.dev.yaml down

compose-up:
	docker compose -f compose.dev.yaml up -d
