# vscode-rucoa

[![build](https://github.com/r7kamura/vscode-rucoa/actions/workflows/build.yml/badge.svg)](https://github.com/r7kamura/vscode-rucoa/actions/workflows/build.yml)

VSCode extension for [rucoa](https://github.com/r7kamura/rucoa).

## Install

~~Install via Visual Studio Marketplace~~ Coming soon!

- [Rucoa - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=r7kamura.vscode-rucoa)

This extenison requires `rucoa` command is available in your workspace, which can be installed by `gem install rucoa`.

If `Gemfile` exists in your current directory or any of its ancestor directories, `bundle exec rucoa` is used instead. So you need to add `gem 'rucoa'` to your `Gemfile` in such case:

```ruby
# Gemfile
gem 'rucoa'
```

If it is a Rails project, I recommend you to write it like this:

```ruby
# Gemfile
group :development do
	gem 'rucoa', require: false
end
```

The rucoa gem is not so heavy gem, but it is a good practice to avoid `require` unnecessary gems on Rails app initialization phase.
