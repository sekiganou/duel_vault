COMPOSE := docker-compose.dev.yml

up:
	docker compose -f ${COMPOSE} up

prune:
	docker system prune -f

down:
	docker compose -f ${COMPOSE} down

build:
	docker compose -f ${COMPOSE} build

restart:
	docker compose -f ${COMPOSE} down && docker compose -f ${COMPOSE} up