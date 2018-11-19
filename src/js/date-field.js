var parseDate = require('i18n-parse-date'),
    i18nContext = require('i18n-context')('ember_date_field', require.resolve('../locales')),
    t = i18nContext.t;

module.exports = require('ember-text-field').extend({
    autocomplete: 'off',

    min: null,
    max: null,

    init: function() {
        this._super();
        var min = this.get('min'),
            max = this.get('max');
        if (min && typeof(min) !== 'number') {
            this.set('min', Number(min));
        }
        if (max && typeof(max) !== 'number') {
            this.set('max', Number(max));
        }
    },

    sameDateString: function() {
        return t('same_date');
    }.property(),

    sameDate: null,

    showSelectorOnDownArrow: true,

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
                return t('yesterday');
            }
            if (value.isSame(moment(), 'day')) {
                return t('today');
            }
            if (value.isSame(moment().add(1, 'day'), 'day')) {
                return t('tomorrow');
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
        return Ember.isEmpty(inputValue) ? null : parseDate(inputValue)
    },

    validateInputValue: function(inputValue) {
        if (!Em.isEmpty(inputValue) && this.get('sameDateString') != inputValue && !(this.get('relative') && [t('yesterday'), t('today'), t('tomorrow')].contains(inputValue))) {
            var value = parseDate(inputValue);
            if (!value) {
                throw new UserError(t('invalid_date'));
            }

            // Range validation
            var min = this.get('min')
            var max = this.get('max')
            if (!Em.isEmpty(min) && value < min) {
                throw new UserError(t('must_be_greater', { number: this.formatInputValue(min) }));
            }
            if (!Em.isEmpty(max) && value > max) {
                throw new UserError(t('must_be_less', { number: this.formatInputValue(max) }));
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
                self.selectValue(date);
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
            if (e.which == $.keyCode.DOWN && this.get('showSelectorOnDownArrow')) {
                e.preventDefault();
                this.showSelector();
            }
        }
    },

    selectValue: function(value) {
        this.set('value', value);
        Ember.run.schedule('sync', this, function() {
            this.sendAction('didSelect', value);
        });
    }
});

module.exports.locale = i18nContext.locale;

module.exports.lang = function() {
    console.warn('.lang() is deprecated. Use .locale() instead');
    return i18nContext.locale.apply(null, arguments);
};
