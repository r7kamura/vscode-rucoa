# vscode-rucoa

[![build](https://github.com/r7kamura/vscode-rucoa/actions/workflows/build.yml/badge.svg)](https://github.com/r7kamura/vscode-rucoa/actions/workflows/build.yml)

VSCode extension for [rucoa](https://github.com/r7kamura/rucoa).

## Install

~~Install via Visual Studio Marketplace~~ Coming soon!

## Setup

This extenison expects that `rucoa` is available in your workspace. If Gemfile exists in your current directory or any of its ancestor directories, `bundle exec rucoa` is used instead, so you need to add `gem 'rucoa'` to your Gemfile in such case:

```ruby
# Gemfile
gem 'rucoa'
```
