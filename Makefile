COMPOSE := docker-compose.dev.yml
MIGRATION := $1

up:
	docker compose -f ${COMPOSE} up

prune:
	docker system prune -f

down:
	docker compose -f ${COMPOSE} down

build:
	docker compose -f ${COMPOSE} build && docker system prune -f

restart:
	docker compose -f ${COMPOSE} down && docker compose -f ${COMPOSE} up

migrate:
	npx prisma migrate dev --name ${MIGRATION}