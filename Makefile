REMOTE = root@207.154.240.150

all: copy restart

copy:
	scp back/build/index.js $(REMOTE):/usr/bin/trees/
	scp front/build/index.js $(REMOTE):/usr/bin/trees/front
	scp -r front/views $(REMOTE):/usr/bin/trees/front/
	scp back/config.json $(REMOTE):/usr/bin/trees
	scp trees.service $(REMOTE):/etc/systemd/system/
	scp .env $(REMOTE):/usr/bin/trees

restart:
	ssh $(REMOTE) "systemctl daemon-reload && service trees restart"
