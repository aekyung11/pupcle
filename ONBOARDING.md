it sets up the database in docker  
docker 내부에 데이터베이스를 생성한다

```fish
~> UID=(id -u) yarn docker setup
```

---

## Docker mode

If you want to use only docker, use this to start  
(recommended for windows and linux)

만약 docker만 사용하고 싶을 경우(윈도우나 리눅스의 경우),  
아래의 command를 사용한다.

```fish
~> UID=(id -u) yarn docker start
```

use ctrl + c to stop

---

## Local mode with docker database

If you want to use docker for the database,  
we have to modify .env file to point to docker for the database.

만약 docker를 사용해 db를 시작하고 싶다면,  
.env 파일에서 db에 해당하는 부분이 docker를 가리키도록 파일을 수정해야한다.

The app has been set up to work inside docker, but we have to connect the
database using localhost.

현재는 app이 docker 내부에서만 유효하게끔 설정되어있는데, 우리는 localhost룰 이
용해 db를 연결해야 한다.

In the .env file, we have to change  
.env 파일에서 이 부분을

```
ROOT_DATABASE_URL=...@db/postgres
```

to  
이렇게 수정하고

```
ROOT_DATABASE_URL=...@localhost:6543/postgres
```

set 아래와 같이 설정한다.

```
DATABASE_HOST=localhost:6543
```

start database using this command:  
이후 터미널에서 아래의 command를 사용한다.

```fish
~> UID=(id -u) yarn docker db:up
```

```fish
~> yarn start
```

use ctrl + c to stop the app.

To stop the database, use the command below:

```fish
~> UID=(id -u) yarn docker compose stop db
```
