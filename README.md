# smh because robust Django reloading seems to be hard

Just a little file-watcher-child-process-reloader.

## Usage

smh can parse TOML, JSON and command line configuration.
Command line configuration is augmented and appended (where possible)
to the file configuration.

By default, smh tries to look for `smh.toml` in the current working directory,
but you can pass another filename on the command line if you feel like it.

An example TOML file might be

```toml
paths = "my_project"
preset = "django"
```

This will automatically reload a `manage.py runserver` when Python files in
`my_project` change.
(You could express this as `smh --paths my_project --preset django`.)

The same expressed without the preset and with arrays expanded:

```toml
paths = ['my_project']
ignores = [
	'/pyc$/',
	'/.+(node_modules|bower_components|__pycache__).+/'
]
includes = [/.py$/]
child =  ['python', 'manage.py', 'runserver', '--noreload']
```

(You can use `--dumpConfig` to dump the config after all parsing's said and done.)

## Configuration options

* `child`: The child command line (either as args array or a string)
* `delay`: Delay in msec before restarting the child after changes have occurred.
* `dumpConfig`: Dump the configuration to the console at startup.
* `ignores`: Patterns (glob or `/regexp/`) to ignore 
* `includes`: Patterns (glob or `/regexp/`) to include (if empty, everything is included)
* `logEvents`: Log all the file system events to the console at startup.
* `paths`: Paths/globs to watch.
* `preset`: A configuration preset (see below).
* `signal`: The signal to send to the child to have it quit. Defaults to `SIGINT`.

## Presets

* `python`: Sane defaults for Python development, ignoring `node_modules` and `bower_components`
* `django`: As `python`, with an added `child = "python manage.py runserver --noreload"`.
