build:
	docker build -t turndown-service . 

run: build
	docker run -p 9999:9999 --rm -d turndown-service
