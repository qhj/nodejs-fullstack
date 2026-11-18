env "sqlite" {
  dev = "sqlite://dev?mode=memory&_fk=1"

  schema {
    src = "file://.dev/schema.sql"
  }

  migration {
    dir = "file://atlas/migrations"
  }
}