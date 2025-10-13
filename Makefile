COMPOSE := docker-compose.dev.yml
MIGRATION := $1

up:
	docker compose -f ${COMPOSE} up

prune:
	docker system prune -f && docker volume prune -f

down:
	docker compose -f ${COMPOSE} down

# build the development images
build:
	docker compose -f ${COMPOSE} build && docker system prune -f

# test the production build
build-prod:
	docker build -f Dockerfile.prod -t gitea.dojo-vernier.ts.net/duelvault:prod .

restart:
	docker compose -f ${COMPOSE} down && docker compose -f ${COMPOSE} up

migrate:
	npx prisma migrate dev --name ${MIGRATION}