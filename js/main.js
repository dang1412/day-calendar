'use strict'
var SLOT_HEIGHT = 21,
  COLORS = ['#5484ED', '#A4BDFC', '#46D6DB', '#7AE7BF', '#FBD75B', '#FFB878', '#FF887C', '#DC2127', '#DBADFF'];

/*
 * Day Calendar
 */
var DayCalendar = function (ele) {
  this.element = $(ele);  // calendar table element
  this.eventContainer = null; // events container element
  this.tempEvent = null;  // temp event element
  this.tempEventInfo = null;
  this.editEvent = null;  // edit event form
  this.containerBaseWidth = null; // events container width
  this.events = [];
  this.baseTime = null;
  this.init();
}

DayCalendar.prototype = {
  init: function () {
    console.log('init');

    this.baseTime = new Date();
    this.baseTime.setHours(0);

    var ele = this.element, eventContainer, tempEvent, editEvent, self = this;
    // load view
    ele.load('/day-calendar/views/grid_container.html', function (response, status, xhr) {
      console.log('load done');
      if ( status == "error" ) {
        var msg = "Sorry but there was an error: ";
        return console.log(msg);
      }

      self.eventContainer = eventContainer = ele.find('.events-container'),
      self.tempEvent = tempEvent = eventContainer.find('.temp-event');
      self.editEvent = editEvent = eventContainer.find('.edit-event');

      // Event Register

      editEvent.on('mousedown', function (event) {
        //console.log('prevent event');
        //event.preventDefault();
      })

      $(document).on('mousedown', function (event) {
        if ( !operationOnEditEvent(event) ) {
          console.log('hide');
          self.hideTempEvent();
        }
      })

      editEvent.find('.save-btn').on('click', function () {
        self.saveEvent( self.edittingEventObj );
      })

      eventContainer.on('mousedown', mousedown);

      // load init data from file
      self.loadEvents();
    });

    var renderTempEvent = this.renderTempEvent.bind(this),
      showEditEvent = this.showEditEvent.bind(this);

    function mousedown (event) {
      // not count if we are operating on edit box
      if ( operationOnEditEvent(event) || operationOnEvent(event) ) return;
      event.preventDefault();

      $(document).on('mousemove', mousemove);
      $(document).on('mouseup', mouseup);

      var startX = event.pageX,
        startY = event.pageY,
        eleBaseY = eventContainer.offset().top,
        eleBaseX = eventContainer.offset().left;

      self.eleBaseY = eleBaseY;
      self.eleBaseX = eleBaseX;

      var startSlot = parseInt( ( startY - eleBaseY ) / SLOT_HEIGHT ),
        endSlot = null;
      console.log(startY);

      function mousemove (event) {
        var curSlot = parseInt( ( event.pageY - eleBaseY ) / SLOT_HEIGHT );
        if (curSlot != endSlot) {
          endSlot = curSlot;

          self.tempEventInfo = {startSlot: startSlot, endSlot: endSlot}
          if ( startSlot > endSlot ) {
            self.tempEventInfo.startSlot = endSlot;
            self.tempEventInfo.endSlot = startSlot;
          }

          renderTempEvent();
        }
        //console.log(event.pageY);
      }

      function mouseup (event) {
        $(document).off('mousemove', mousemove);
        $(document).off('mouseup', mouseup);
        if (!endSlot) return;
        var pos = {top: event.pageY - eleBaseY, left: event.pageX - eleBaseX}
        showEditEvent(pos);
      }
    }

    // detect the occurred event is on edit box or not
    function operationOnEditEvent (event) {
      return $(event.target).closest('.edit-event').length > 0;
    }

    function operationOnEvent (event) {
      return $(event.target).closest('.event-wrapper').length > 0;
    }

    //

    //this.eventContainer = eventContainer;
    //this.tempEvent = tempEvent;
  },

  saveEvent: function (dayEvent) {
    var eventName = this.editEvent.find('.event-name').val(),
      eventDes = this.editEvent.find('.event-des').val();

    this.editEvent.find('.event-name').removeClass('error');
    if ( !eventName ) {
      this.editEvent.find('.event-name').addClass('error');
      return;
    }

    if ( dayEvent ) { // update
      dayEvent.name = eventName;
      dayEvent.des = eventDes;
      dayEvent.updateTemplate();
    }

    else {  // add new
      var startSlot = this.tempEventInfo.startSlot,
        endSlot = this.tempEventInfo.endSlot;

      var self = this;
      var dayEvent = new DayEvent(self, eventName, eventDes, startSlot, endSlot, null, function () {
        self.addEvent( dayEvent );
      });
    }

    this.hideTempEvent();

  },

  addEvent: function (dayEvent) { // add event in order of endSlot
    // find position
    for (var i = 0; i < this.events.length; i ++) {
      if ( this.events[i].endSlot > dayEvent.endSlot ) break;
    }

    this.events.splice(i, 0, dayEvent);

    //this.events.push(dayEvent);
    this.eventContainer.append( dayEvent.eventElement );
    //this.renderEvents();

    this.calculateEventsPosition();
  },

  renderEvents: function () {
    //for ()
  },

  updateEventsPosition: function () {
    for (var i = 0; i < this.events.length; i ++) {
      this.events[i].updatePosition();
    }
  },

  renderTempEvent: function () {
    var startSlot = this.tempEventInfo.startSlot,
      endSlot = this.tempEventInfo.endSlot;
    console.log(startSlot, endSlot);

    this.tempEvent.show();
    this.tempEvent.find('.time').text( DayCalendar.Utils.showTimeStr(startSlot, endSlot) );
    this.tempEvent.css('top', startSlot * SLOT_HEIGHT);
    this.tempEvent.css('height', (endSlot - startSlot + 1) * SLOT_HEIGHT);
  },

  hideTempEvent: function () {
    this.tempEventInfo = {};
    this.edittingEventObj = null;
    this.tempEvent.hide();
    this.editEvent.hide();
  },

  showEditEvent: function (pos, dayEvent) {
    var startSlot = this.tempEventInfo.startSlot || dayEvent.startSlot,
      endSlot = this.tempEventInfo.endSlot || dayEvent.endSlot;

    pos.left = Math.min( pos.left, $(window).width() - 400 - this.eleBaseX);

    this.editEvent.show();
    this.editEvent.find('.event-time').text( DayCalendar.Utils.showTimeStr(startSlot, endSlot) );
    this.editEvent.css('top', pos.top);
    this.editEvent.css('left', pos.left);
    this.editEvent.find('.event-name').focus();

    if ( dayEvent ) {
      this.editEvent.find('.event-name').val( dayEvent.name );
      this.editEvent.find('.event-des').val( dayEvent.des );
      this.edittingEventObj = dayEvent;
    }
    else {
      this.editEvent.find('.event-name').val('');
      this.editEvent.find('.event-des').val('');
    }
  },

  // Algorithm to calculate event position
  calculateEventsPosition: function () {
    //[{startSlot: 1, endSlot: 5}, {startSlot: 3, endSlot: 7}, {startSlot: 4, endSlot: 9}, {startSlot: 6, endSlot: 10}, {startSlot: 11, endSlot: 14}, {startSlot: 13, endSlot: 15}]
    this.events.sort(function (e1, e2) {
      return e1.endSlot - e2.endSlot;
    });
    calculateEventsPosition( this.events );
    this.updateEventsPosition();
  },

  remove: function (dayEvent) {
    // find index
    var i;
    for ( i = 0; i < this.events.length; i ++) {
      if (this.events[i].id == dayEvent.id) break;
    }

    if (dayEvent) {
      dayEvent.destroy();
      this.events.splice(i, 1);
      this.calculateEventsPosition();
    }
  },

  loadEvents: function () {
    var self = this;
    $.getJSON('/day-calendar/js/data.json', function (data) {
      console.log(data);
      addEvents(data, 0);
    })

    function addEvents (data, i) {
      if (i >= data.length) return;
      var dayEvent = new DayEvent(self, data[i].name, data[i].des, data[i].startSlot, data[i].endSlot, null, function () {
        self.addEvent( dayEvent );
        addEvents(data, i + 1);
      });
    }
  }
};

// DayCalendar util functions
DayCalendar.Utils = {
  showTimeStr: function (startSlot, endSlot) {
    var date = new Date();
    var startTime = new Date(),
      endTime = new Date();

    startTime.setHours( startSlot * .5, (startSlot % 2) * 30 );
    endTime.setHours( (endSlot + 1) * .5, ( (endSlot + 1) % 2 ) * 30 );

    return timeToStr(startTime) + ' - ' + timeToStr(endTime);

    function timeToStr (time) {
      var min = time.getMinutes() < 10 ? '0' + time.getMinutes() : time.getMinutes();
      var hour = time.getHours();
      var am = hour < 12 ? 'a' : 'p';
      hour = hour > 12 ? hour - 12 : hour;

      return hour + ':' + '' + min + am;
    }
  }
}

/*
 * Day Event
 */
var DayEvent = function (dayCalendar, name, des, startSlot, endSlot, color, loadDone) {
  this.parent = dayCalendar;
  this.name = name;
  this.des = des;
  this.startSlot = startSlot;
  this.endSlot = endSlot;
  this.color = color || this.randomColor();
  this.id = Math.random().toString(34).slice(2);
  this.loadTemplate(loadDone);
}

DayEvent.prototype = {
  loadTemplate: function ( loadDone ) {
    var self = this;
    var eventElement = $('<div id="event-' + this.id + '" class="event-wrapper"></div>');

    eventElement.load('/day-calendar/views/event.html', function (response, status, xhr) {
      self.updateTemplate();
      if ( typeof(loadDone) === 'function' ) {
        loadDone();
        eventElement.on('mousedown', mousedown);
        eventElement.on('click', click);
      }
    });

    this.eventElement = eventElement;

    var startX, startY;
    var calculateEventsPosition = self.parent.calculateEventsPosition.bind(self.parent);

    var dragging = false, resizing = false, action = '';

    function mousedown (e) {
      e.preventDefault();
      $(document).on('mousemove', mousemove);
      $(document).on('mouseup', mouseup);

      startX = e.pageX;
      startY = e.pageY;

      dragging = false;
      resizing = false;

      action = isResize(e) ? 'resizing' : 'dragging';
    }

    function mousemove (e) {
      var movedSlot = parseInt( ( e.pageY - startY ) / SLOT_HEIGHT );
      if ( movedSlot == 0 ) return;
      if ( action == 'dragging' ) {
        dragging = true;
        var startS = self.startSlot + movedSlot,
          endS = self.endSlot + movedSlot;

        if ( startS >= 0 &&  endS < 48 ) {
          startY = e.pageY;
          self.startSlot = startS;
          self.endSlot = endS;
          self.updateTemplate();
          self.eventElement.addClass('dragging');
        }
      }
      else {
        resizing = true;
        var endS = self.endSlot + movedSlot;
        if ( endS >= self.startSlot && endS < 48 ) {
          startY = e.pageY;
          self.endSlot = endS;
          self.updateTemplate();
          self.eventElement.addClass('resizing');
        }
      }
    }

    function mouseup (e) {
      $(document).off('mousemove', mousemove);
      $(document).off('mouseup', mouseup);

      if ( self.eventElement.hasClass('dragging') ) {
        console.log('drag done');
        self.eventElement.removeClass('dragging');
        calculateEventsPosition();
      }
      else if ( self.eventElement.hasClass('resizing') ) {
        console.log('resize done');
        self.eventElement.removeClass('resizing');
        calculateEventsPosition();
      }
    }

    function isResize (e) {
      return $(e.target).closest('.ui-resizable-handle').length > 0;
    }

    function isClose (e) {
      return $(e.target).closest('.icon-close').length > 0;
    }

    function click (e) {
      if ( dragging || resizing ) {
        return;
      }
      if ( isClose(e) ) {
        console.log('------remove', self.id, self.name);
        return self.parent.remove(self);
      }
      var pos = {top: event.pageY - self.parent.eleBaseY, left: event.pageX - self.parent.eleBaseX}
      self.parent.showEditEvent(pos, self);
    }
  },

  updateTemplate: function () {
    this.eventElement.find('.time').text( DayCalendar.Utils.showTimeStr(this.startSlot, this.endSlot) );
    this.eventElement.find('.name').text(this.name);
    this.eventElement.find('.des').text(this.des);
    this.eventElement.css('top', this.startSlot * SLOT_HEIGHT);
    this.eventElement.css('height', (this.endSlot - this.startSlot + 1) * SLOT_HEIGHT);
    if (this.color) {
      this.eventElement.css('background-color', this.color);
    }
  },

  updatePosition: function () {
    if ( !this.b ||  !this.s) return;
    try {
      this.eventElement.css('width', ( 100 / this.b - .6 ) + '%');
      this.eventElement.css('left', ( (this.s - 1) / this.b * 100 + .3 ) + '%');
    } catch(e) {
      console.log(e);
    }
  },

  randomColor: function () {
    var n = COLORS.length;
    return COLORS[ Math.round( Math.random() * n ) ];
  },

  destroy: function () {
    this.eventElement.remove();
  }
}

var dayCalendar;
jQuery( document ).ready(function($) {
  dayCalendar = new DayCalendar('.calendar-container');
});
