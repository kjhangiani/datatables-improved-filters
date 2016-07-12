/**
 * Improved Filters for Datatables
 * ©2016 Kevin Jhangiani
 *
 * requires MetaData plugin (bower datatables-metadata)
 *
 * .column().if(conditionObject)
 * .column().if.eq(val)
 * .column().if.gt(min)
 * .column().if.gte(min)
 * .column().if.lt(max)
 * .column().if.lte(max)
 * .column().if.between(min, max) == .if.gte(min).if.lt(max)
 *
 * .column().if.after(dateMin)
 * .column().if.before(dateMax)
 * .column().if.during(dateMin, dateMax)
 *
 * .column().if.hasAny(splitBy, value1, value2, ... valueN)
 * .column().if.hasAny(splitBy, [value1, value2, ... valueN])
 *
 * .column().if.hasAll(splitBy, value1, value2, ... valueN)
 * .column().if.hasAll(splitBy, [value1, value2, ... valueN])
 *
 */


(function( factory ){
  if ( typeof define === 'function' && define.amd ) {
    // AMD
    define( ['jquery', 'datatables.net'], function ( $ ) {
      return factory( $, window, document );
    } );
  }
  else if ( typeof exports === 'object' ) {
    // CommonJS
    module.exports = function (root, $) {
      if ( ! root ) {
        root = window;
      }

      if ( ! $ || ! $.fn.dataTable ) {
        $ = require('datatables.net')(root, $).$;
      }

      return factory( $, root, root.document );
    };
  }
  else {
    // Browser
    factory( jQuery, window, document );
  }
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;


var _instCounter = 0;

var _dtImprovedFilters = DataTable.ext.improvedFilters;



/**
 * @param {[type]}
 * @param {[type]}
 */
var ImprovedFilters = function(dt, config) {
  this.s = {
    dt: new DataTable.Api(dt),
    namespace: 'dtmd'+(_instCounter++)
  };

  this._constructor();
};


$.extend( ImprovedFilters.prototype, {
  /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Constructor
   */

  /**
   * ImprovedFilters constructor
   * @private
   */
  _constructor: function() {

  }

});



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Statics
 */


/**
 * ImprovedFilters defaults.
 * @type {Object}
 * @static
 */
ImprovedFilters.defaults = {};

ImprovedFilters._filter = function(filters, data) {
  if (!filters) { return true; }
  var keys = Object.keys(filters);
  if (!keys || !keys.length) { return true; }

  var result = true;
  for (var i = 0, ien=keys.length; i < ien; i++) {
    result = result && ImprovedFilters._filterValue(data, filters[keys[i]], keys[i]);

    // break out early if we fail a check
    if (!result) { return false; }
  }

  return result;
};

ImprovedFilters._filterValue = function(data, checkVal, op) {
  // if null, we are not checking this filter, return true
  if (checkVal === null) { return true; }

  switch(op) {
    case 'lt':
      if (data !== null && data < checkVal) { return true; }
      else { return false; }
      break;

    case 'lte':
      if (data !== null && data <= checkVal) { return true; }
      else { return false; }
      break;

    case 'gt':
      if (data !== null && data > checkVal) { return true; }
      else { return false; }
      break;

    case 'gte':
      if (data !== null && data >= checkVal) { return true; }
      else { return false; }
      break;

    case 'eq':
      // strictly equals?
      if (data !== null && data == checkVal) { return true; }
      else { return false; }
      break;

    // date filters, requires moment
    case 'after':
    case 'before':
      return ImprovedFilters._filterDate(data, checkVal, op);
      break;

    // array filters
    case 'hasAll':
    case 'hasAny':
      return ImprovedFilters._filterArray(data, checkVal, op);
      break;


  }

  // invalid op, return true
  return true;
};

ImprovedFilters._filterArray = function(data, checkVal, op) {
  var arr = data.split(checkVal.splitBy);
  var res = true;
  switch(op) {
    case 'hasAll':
      for (var i=0; i < checkVal.values.length; i++) {
        res = res && (arr.indexOf(checkVal.values[i]) >= 0);
        // break early if we turn false
        if (!res) { break; }
      }
    break;
    case 'hasAny':
      res = false;
      for (var i=0; i < checkVal.values.length; i++) {
        res = res || (arr.indexOf(checkVal.values[i]) >= 0);
        // break early if we turn true
        if (res) { break; }
      }
    break;
  }

  return res;
};

ImprovedFilters._filterDate = function(data, checkVal, op) {
  // no moment, include row
  if (!moment) { return true; }

  // data is null, exclude row
  if (data === null) { return false; }

  var m = moment(data);
  // invalid date, exclude row
  if (!m.isValid()) { return false; }
  var dataTimestamp = m.format('x');


  m = moment(checkVal);
  // invalid boundary, include row
  if (!m.isValid()) { return true; }
  var checkValTimestamp = m.format('x');

  // convert data/checkVal to timestamps, do numeric comparison
  switch(op) {
    case 'after':
      return ImprovedFilters._filterValue(dataTimestamp, checkValTimestamp, 'gte');
      break;
    case 'before':
      return ImprovedFilters._filterValue(dataTimestamp, checkValTimestamp, 'lte');
      break;
  }

  // invalid op, return true?
  return true;

};

/**
 * Version information
 * @type {string}
 * @static
 */
ImprovedFilters.version = '0.1.2';


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables API Hooks
 *
 */

/**
  .column().if()

  clear all conditions on this column

  chainable, returns Api
**/
DataTable.Api.register('column().if()', function () {
  var colIndex = this.index();

  // metadata plugin not loaded, just return
  if (this.settings()[0]._metadataEnabled !== true) { return this; }

  this.column(colIndex).meta.remove('_filters');
  return this;
});


/**
  .column().if.eq()
  .column().if.eq(value)

  include row if column data > min, or clear this filter

  chainable, returns Api
**/
DataTable.Api.register('column().if.eq()', function (value) {
  var colIndex = this.index();

  // metadata plugin not loaded, just return
  if (this.settings()[0]._metadataEnabled !== true) { return this; }

  // if no parameters, or only a single null parameter, then clear the search state
  if (!arguments.length || (arguments.length === 1 && value === null)) {
    this.column(colIndex).meta.merge('_filters', { eq: null });
    return this;
  }

  // if we have parameters, set them
  // @todo: validate these values
  this.column(colIndex).meta.merge('_filters', { eq: value });
  return this;
});


/**
  .column().if.gt()
  .column().if.gt(min)

  include row if column data > min, or clear this filter

  chainable, returns Api
**/
DataTable.Api.register('column().if.gt()', function (min) {
  var colIndex = this.index();

  // metadata plugin not loaded, just return
  if (this.settings()[0]._metadataEnabled !== true) { return this; }

  // if no parameters, or only a single null parameter, then clear the search state
  if (!arguments.length || (arguments.length === 1 && min === null)) {
    this.column(colIndex).meta.merge('_filters', { gt: null });
    return this;
  }

  // if we have parameters, set them
  // @todo: validate these values
  this.column(colIndex).meta.merge('_filters', { gt: min });
  return this;
});



/**
  .column().if.gte()
  .column().if.gte(min)

  include row if column data >= min, or clear this filter

  chainable, returns Api
**/
DataTable.Api.register('column().if.gte()', function (min) {
  var colIndex = this.index();

  // metadata plugin not loaded, just return
  if (this.settings()[0]._metadataEnabled !== true) { return this; }

  // if no parameters, or only a single null parameter, then clear the search state
  if (!arguments.length || (arguments.length === 1 && min === null)) {
    this.column(colIndex).meta.merge('_filters', { gte: null });
    return this;
  }

  // if we have parameters, set them
  // @todo: validate these values
  this.column(colIndex).meta.merge('_filters', { gte: min });
  return this;
});


/**
  .column().if.lt()
  .column().if.lt(max)

  include row if column data < max, or clear this filter

  chainable, returns Api
**/
DataTable.Api.register('column().if.lt()', function (max) {
  var colIndex = this.index();

  // metadata plugin not loaded, just return
  if (this.settings()[0]._metadataEnabled !== true) { return this; }

  // if no parameters, or only a single null parameter, then clear the search state
  if (!arguments.length || (arguments.length === 1 && max === null)) {
    this.column(colIndex).meta.merge('_filters', { lt: null });
    return this;
  }

  this.column(colIndex).meta.merge('_filters', { lt: max });
  return this;
});


/**
  .column().if.lte()
  .column().if.lte(max)

  include row if column data < max, or clear this filter

  chainable, returns Api
**/
DataTable.Api.register('column().if.lte()', function (max) {
  var colIndex = this.index();

  // metadata plugin not loaded, just return
  if (this.settings()[0]._metadataEnabled !== true) { return this; }

  // if no parameters, or only a single null parameter, then clear the search state
  if (!arguments.length || (arguments.length === 1 && max === null)) {
    this.column(colIndex).meta.merge('_filters', { lte: null });
    return this;
  }

  this.column(colIndex).meta.merge('_filters', { lte: max });
  return this;
});


/**
  .column().if.between()
  .column().if.between(min, max)

  include row if column min <= data < max, or clear this filter

  chainable, returns Api
**/
DataTable.Api.register('column().if.between()', function (min, max) {
  var colIndex = this.index();

  // metadata plugin not loaded, just return
  if (this.settings()[0]._metadataEnabled !== true) { return this; }

  // if no parameters, or only a single null parameter, then clear the search state
  if (!arguments.length) {
    this.column(colIndex).meta.merge('_filters', { gte: null, lte: null });
    return this;
  }

  this.column(colIndex).meta.merge('_filters', { gte: min, lte: max });
  return this;
});


/**
  .column().if.after()
  .column().if.after(dateMin)

  include row if column data >= dateMin, or clear this filter
  requires moment.js

  chainable, returns Api
**/
DataTable.Api.register('column().if.after()', function (dateMin) {
  var colIndex = this.index();

  // metadata plugin not loaded, just return
  if (this.settings()[0]._metadataEnabled !== true) { return this; }

  // if no parameters, or only a single null parameter, then clear the search state
  if (!arguments.length || (arguments.length === 1 && dateMin === null)) {
    this.column(colIndex).meta.merge('_filters', { after: null });
    return this;
  }

  // if we have parameters, set them
  // @todo: validate these values
  this.column(colIndex).meta.merge('_filters', { after: dateMin });
  return this;
});


/**
  .column().if.before()
  .column().if.before(dateMax)

  include row if column data < dateMax, or clear this filter
  requires moment.js

  chainable, returns Api
**/
DataTable.Api.register('column().if.before()', function (dateMax) {
  var colIndex = this.index();

  // metadata plugin not loaded, just return
  if (this.settings()[0]._metadataEnabled !== true) { return this; }

  // if no parameters, or only a single null parameter, then clear the search state
  if (!arguments.length || (arguments.length === 1 && dateMax === null)) {
    this.column(colIndex).meta.merge('_filters', { before: null });
    return this;
  }

  // if we have parameters, set them
  // @todo: validate these values
  this.column(colIndex).meta.merge('_filters', { before: dateMax });
  return this;
});


/**
  .column().if.during()
  .column().if.during(dateMin, dateMax)

  include row if column dateMin < data < dateMax, or clear this filter
  requires moment.js

  chainable, returns Api
**/
DataTable.Api.register('column().if.during()', function (dateMin, dateMax) {
  var colIndex = this.index();

  // metadata plugin not loaded, just return
  if (this.settings()[0]._metadataEnabled !== true) { return this; }

  // if no parameters, or only a single null parameter, then clear the search state
  if (!arguments.length) {
    this.column(colIndex).meta.merge('_filters', { after: null, before: null });
    return this;
  }

  this.column(colIndex).meta.merge('_filters', { after: dateMin, before: dateMax });
  return this;
});


/**
  .column().if.hasAll()
  .column().if.hasAll(splitBy, value1, value2, ... valueN)
  .column().if.hasAll(splitBy, [value1, value2, ... valueN])

  splits column value by splitBy, then checks if array hasAll values passed in

  chainable, returns Api
**/
DataTable.Api.register('column().if.hasAll()', function () {
  var colIndex = this.index();

  // metadata plugin not loaded, just return
  if (this.settings()[0]._metadataEnabled !== true) { return this; }

  var args = Array.prototype.slice.call(arguments);


  // if no parameters, or only a single null parameter, then clear the search state
  if (!args.length || (args.length === 1 && !args[0])) {
    this.column(colIndex).meta.merge('_filters', { hasAll: null });
    return this;
  }

  var splitBy = args.shift();
  var values = args;
  // if our first argument is an array already, and we only have one additional argument, use it as is
  if (args.length === 1 && $.isArray(args[0])) {
    values = args[0];
  }


  // if we have parameters, set them
  // @todo: validate these values
  this.column(colIndex).meta.merge('_filters', { hasAll: { values: values, splitBy: splitBy } });
  return this;
});


/**
  .column().if.hasAny()
  .column().if.hasAny(splitBy, value1, value2, ... valueN)
  .column().if.hasAny(splitBy, [value1, value2, ... valueN])

  splits column value by splitBy, then checks if array hasAny values passed in

  chainable, returns Api
**/
DataTable.Api.register('column().if.hasAny()', function () {
  var colIndex = this.index();

  // metadata plugin not loaded, just return
  if (this.settings()[0]._metadataEnabled !== true) { return this; }

  var args = Array.prototype.slice.call(arguments);


  // if no parameters, or only a single null parameter, then clear the search state
  if (!args.length || (args.length === 1 && !args[0])) {
    this.column(colIndex).meta.merge('_filters', { hasAny: null });
    return this;
  }

  var splitBy = args.shift();
  var values = args;
  // if our first argument is an array already, and we only have one additional argument, use it as is
  if (args.length === 1 && $.isArray(args[0])) {
    values = args[0];
  }


  // if we have parameters, set them
  // @todo: validate these values
  this.column(colIndex).meta.merge('_filters', { hasAny: { values: values, splitBy: splitBy } });
  return this;
});

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables Search Hooks
 *
 */
/**
  custom .ext.search for numeric and date range filtering
  uses settings.columns[i].range to compute search
**/
DataTable.ext.search.push(function(settings, searchData, index, rowData, counter) {
  // if metadata is not enabled, skip this search
  if (settings._metadataEnabled !== true) { return true; }

  // if we have no metadata, or no columns, then short-circuit true
  var metadata = settings._metadata;
  if (!metadata || !metadata.columns || !metadata.columns.length) { return true; }

  var filters;

  for (var i=0,ien=metadata.columns.length; i < ien; i++) {
    if (!metadata.columns[i] || !metadata.columns[i]._filters) { continue; } //skip to next iteration if no metadata on this column

    filters = metadata.columns[i]._filters;
    if (!ImprovedFilters._filter(filters, searchData[i])) {
      return false;
    }
  }

  // if we got here, we are good
  return true;
});


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables interface
 */

// Attach to DataTables objects for global access
$.fn.dataTable.ImprovedFilters = ImprovedFilters;
$.fn.DataTable.ImprovedFilters = ImprovedFilters;

return ImprovedFilters;
}));
