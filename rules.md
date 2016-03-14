---
layout: page
permalink: rules/
title: Northwest Indoor Rules and Policies
---

# {{ page.title }}

{% assign indoor = site.rules | where: "name", "indoor" | first %}
{% assign futsal = site.rules | where: "name", "futsal" | first %}

* [{{ indoor.title }}]({{ indoor.url }})
* [{{ futsal.title }}]({{ futsal.url }})

## Rule modifications for each arena:

{% for rule in site.rules %}

{% if rule.modification %}
* <a href="{{ rule.url }}">{{ rule.title }}</a>
{% endif %}

{% endfor %}