(Linkedin = {
    release: '1.0.5 stable',
    data: {},
    config: {
        autoStart: true,
        inspectorSpeed: 5000,
        sendSpeed: 4000,
        pagerSpeed: 10000,
        scrollDownAuto: 600,
        debug: true,
        message: 'Your custom note message (max 300 length)'
    },
    setEvents: function () {
        this.debug('set events');
    },
    debug: function (a) {
        if (this.config.debug && typeof console === 'object') {
            console.log(a)
        }
    },
    init: function () {
        this.debug('start script');
        this.setDefaults();
        this.setEvents();
        if (this.config.autoStart) {
            this.inspect();
        }
    },
    complete: function () {
        this.debug('script complete');
    },
    sleep: function (a) {
        this.setScroll();
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > a) {
                break;
            }
        }
    },
    totalRows: function () {
        return $('.search-result').length;
    },
    compile: function () {
        this.data.pageButtons = $("button.search-result__action-button").filter(function () {
            return $.trim($(this).text()) === "Connect";
        });
        this.data.pageButtonTotal = this.data.pageButtons.length;
    },
    stop: function () {
        clearInterval(Linkedin.data.pageInterval);
        clearInterval(Linkedin.data.nextInterval);
    },
    setDefaults: function () {
        this.stop();
        this.data = {
            pageInterval: null,
            nextInterval: null,
            pageIndex: (this.data.pageIndex) ? this.data.pageIndex : 1,
            pageButtons: {},
            pageButtonIndex: 0,
            pageButtonTotal: 0,
            lockInpect: false,
            lockClick: false
        };
    },
    sendInvites: function () {
        this.compile();
        this.setScroll();
        this.debug('validing');

        if (this.data.pageButtonTotal === 0 || this.data.lockInpect === true) {

            this.sleep(this.config.sendSpeed);

            return this.nextPage();
        }

        this.sleep(this.data.speed);
        this.debug('sending invite ' + (this.data.pageButtonIndex + 1) + '/' + this.data.pageButtonTotal);

        var button = this.data.pageButtons[this.data.pageButtonIndex];

        this.debug('clicking connect');
        $(button).click();
        this.sleep(Linkedin.config.sendSpeed);

        this.debug('adding a note');
        $("button:contains('Add a note')").click();
        this.sleep(Linkedin.config.sendSpeed);

        this.debug('write a note');
        var textArea = $('textarea[id="custom-message"]');
        textArea.val(this.config.message);
        this.sleep(Linkedin.config.sendSpeed);

        this.debug('send click');
        $("button:contains('Send invitation')").click();
        this.sleep(Linkedin.config.sendSpeed);

        this.debug('close window');
        $("button:contains('Cancel')").click();
        this.sleep(Linkedin.config.sendSpeed);

        this.debug('ignore confirm mail');
        if ($('[id=email]').length) {
            $('.send-invite__cancel-btn').click();
        }

        this.sleep(Linkedin.config.sendSpeed);
        this.stop();

        if (this.closeAll() && this.data.pageButtonIndex === (this.data.pageButtonTotal - 1)) {
            return this.nextPage();
        } else if (this.data.lockInpect === false && this.data.pageButtonIndex < (this.data.pageButtonTotal - 1)) {
            this.data.pageButtonIndex++;
            return this.sendInvites();
        } else {
            this.debug('waiting page overflow down');
            this.sleep(Linkedin.config.sendSpeed);
            return this.nextPage();
        }
    },
    nextPage: function () {
        Linkedin.debug('find page');
        Linkedin.setScroll();
        Linkedin.data.lockInpect = true;
        Linkedin.data.nextInterval = setInterval(function () {
            var pagerButton = $('.artdeco-pagination__button.artdeco-pagination__button--next[id^=ember]');
            Linkedin.debug('check page links...');
            if (pagerButton.length === 0) {
                return false;
            }
            if (Linkedin.data.lockClick === false) {
                Linkedin.debug('call next page (link)');
                Linkedin.data.lockClick = true;
                pagerButton.trigger('click');
            }
            Linkedin.checkRequest();
        }, Linkedin.config.pagerSpeed);
    },
    checkRequest: function () {
        var currentPageIndex = Linkedin.getURIParam('page');
        if (currentPageIndex !== Linkedin.data.pageIndex) {
            Linkedin.data.pageIndex = currentPageIndex;
            Linkedin.setDefaults();
            Linkedin.debug('page ready');
            return Linkedin.inspect();
        }
    },
    closeAll: function () {
        if ($('.send-invite__cancel-btn').length) {
            $('.send-invite__cancel-btn').click();
        }
        return (!$('.send-invite__cancel-btn:visible').length);
    },
    setScroll: function (a) {
        $('body').click();
        window.scrollTo(0, $(window).scrollTop() + ((a) ? a : Linkedin.config.scrollDownAuto));
    },
    inspect: function () {
        this.debug('inspect elements');
        this.data.pageInterval = setInterval(function () {
            Linkedin.setScroll(Linkedin.config.scrollDownAuto);
            if (Linkedin.totalRows() >= 20 && $('.artdeco-pagination__button.artdeco-pagination__button--next[id^=ember]').length) {
                clearInterval(Linkedin.data.pageInterval);
                Linkedin.sendInvites();
            } else {
                Linkedin.debug('listening..');
            }
        }, Linkedin.config.inspectorSpeed);
    },
    getURIParam: function (name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }
}).init();