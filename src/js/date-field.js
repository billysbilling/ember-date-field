var i18n = require('i18n').module('ember_date_field', require.resolve('../locales'));

module.exports = require('ember-text-field').extend({
    autocomplete: 'off',
    
    sameDateString: i18n.t('same_date'),
    
    sameDate: null,

    relative: false,

    init: function() {
        this._super();
        this.reformatInputValue(); //Trick to make sure that sameDate was set when formatting the inputValue
    },
    
    picker1Icon: 'icons/calendar',

    manipulateValue: function(value) {
        if (typeof value === 'string') {
            value = moment(value, 'YYYY-MM-DD');
        }
        value = value || null;
        Ember.assert('Value `'+value+'` is a not a valid moment object or null.', value === null || moment.isMoment(value));
        return value;
    },

    formatInputValue: function(value) {
        if (Ember.isEmpty(value)) {
            return null;
        }
        if (this.get('relative')) {
            if (value.isSame(moment().subtract(1, 'day'), 'day')) {
                return i18n.t('yesterday');
            }
            if (value.isSame(moment(), 'day')) {
                return i18n.t('today');
            }
            if (value.isSame(moment().add(1, 'day'), 'day')) {
                return i18n.t('tomorrow');
            }
        }
        var sameDate = this.get('sameDate');
        if (sameDate && value.format('L') == sameDate.format('L')) {
            return this.get('sameDateString');
        }
        return value.format('L');
    },

    sameDateDidChange: function() {
        this.reformatInputValue();
    }.observes('sameDate'),
    
    unformatInputValue: function(inputValue) {
        return Ember.isEmpty(inputValue) ? null : Billy.util.parseDate(inputValue)
    },
    
    validateInputValue: function(inputValue) {
        if (!Em.isEmpty(inputValue) && this.get('sameDateString') != inputValue && !(this.get('relative') && [i18n.t('yesterday'), i18n.t('today'), i18n.t('tomorrow')].contains(inputValue))) {
            var value = Billy.util.parseDate(inputValue);
            if (!value) {
                throw new UserError(i18n.t('invalid_date'));
            }
        }
    },

    selector: null,
    
    didClickPicker1: function() {
        if (this.get('selector')) {
            this.hideSelector();
        } else {
            this.showSelector();
        }
        this.focus();
    },

    showSelector: function() {
        var self = this,
            selector = this.get('selector');
        if (!selector) {
            selector = this.container.lookup('component:date-selector');
            this.set('selector', selector);
            selector.set('value', this.get('value'));
            selector.set('keyEl', this.$());
            selector.one('select', function(date) {
                self.set('value', date);
                self.hideSelector();
            });
            selector.one('willDestroyElement', function() {
                self.set('selector', null);
            });
            selector.show(this);
        }
    },
    
    hideSelector: function() {
        var selector = this.get('selector');
        if (selector) {
            selector.destroy();
        }
    },
    
    keyDown: function(e) {
        if (!this.get('selector')) {
            if (e.which == $.keyCode.DOWN) {
                e.preventDefault();
                this.showSelector();
            }
        }
    }
});

module.exports.lang = i18n.lang;