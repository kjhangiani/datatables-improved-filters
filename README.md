# Datatables-ImprovedFilters
Datatables Improved Filters Plugin - API hooks for more sophisticated column-specific filtering.

This plugin requires `datatables-metadata` to function.  If `datatables-metadata` is not included, this plugin will not do anything.

# Installation

Install the package via bower.

```
bower install datatables-metadata
bower install datatables-improved-filters
```

# Configuration

See the README for `datatables-metadata` for more information on enabling that plugin.  `datatables-metadata` requires the `M` feature flag.
`datatables-improved-filters` has no initialization requirements.

# Usage

This plugin provides the following additional API calls:

### Improved Filters

Filter columns using various utility functions.  Column filtering is analagous to searching (and uses `search` orthogonal data), and is state saved (via the metadata plugin)

Date filters require moment.js

#### General Filters

- `.column().if()` // clear all filters on the specified column

- `.column().if.eq(val)` // filter for rows that contain data in this column that is equal (eq) `val`.  Loose equality.
- `.column().if.eq()` // clear eq filter


#### Numeric Filters

- `.column().if.gt(min)` // numeric filter for rows that contain data in this column that is greater than (gt) `min`
- `.column().if.gt()` // clear gt filter

- `.column().if.gte(min)` // numeric filter for rows that contain data in this column that is greater than or equals (gte) `min`
- `.column().if.gte()` // clear gte filter

- `.column().if.lt(max)` // numeric filter for rows that contain data in this column that is less than (lt) `max`
- `.column().if.lt()` // clear lt filter

- `.column().if.lte(max)` // numeric filter for rows that contain data in this column that is less than or equals (lte) `max`
- `.column().if.lte()` // clear lte filter


#### Date Filters

- `.column().if.between(min, max)` // numeric filter for data between `min` and `max`, equivalent to `.if.gte(min).if.lte(max)`
- `.column().if.between()` // clear between filter

- `.column().if.after(dateMin)` // *requires moment.js* date filter for rows that contain dates in this column that is after `dateMin`.
- `.column().if.after()` // clear after filter

- `.column().if.before(dateMax)` // *requires moment.js* date filter for rows that contain dates in this column that is before `dateMax`.
- `.column().if.before()` // clear before filter

- `.column().if.during(dateMin, dateMax)` // *requires moment.js* date filter for data between `dateMin` and `dateMax`, equivalent to `.if.after(dateMin).if.before(dateMax)`
- `.column().if.during()` // clear during filter


#### Array Filters

- `.column().if.hasAny(splitBy, value1, value2, ... valueN)` // splits string data in column by `splitBy`, then searches corresponding array for ANY of `value1...valueN`
- `.column().if.hasAny(splitBy, [value1, value2, ... valueN])` // identical to above, but accepts second argument as an array for convenience
- `.column().if.hasAny()` // clear hasAny filter

- `.column().if.hasAll(splitBy, value1, value2, ... valueN)` // splits string data in column by `splitBy`, then searches corresponding array for ALL of `value1...valueN`
- `.column().if.hasAll(splitBy, [value1, value2, ... valueN])` // identical to above, but accepts second argument as an array for convenience
- `.column().if.hasAll()` // clear hasAll filter
