(function (window) {
    'use strict';
    var support = {
            animations: Modernizr.cssanimations
        },
        animEndEventNames = {
            'WebkitAnimation': 'webkitAnimationEnd',
            'OAnimation': 'oAnimationEnd',
            'msAnimation': 'MSAnimationEnd',
            'animation': 'animationend'
        },
        // animation end event name
        animEndEventName = animEndEventNames[Modernizr.prefixed('animation')];
    /**
     * extend obj function
     */
    function extend(a, b) {
        for (var key in b) {
            if (b.hasOwnProperty(key)) {
                a[key] = b[key];
            }
        }
        return a;
    }
    /**
     * createElement function
     * creates an element with tag = tag, className = opt.cName, innerHTML = opt.inner and appends it to opt.appendTo
     */
    function createElement(tag, opt) {
        var el = document.createElement(tag)
        if (opt) {
            if (opt.cName) {
                el.className = opt.cName;
            }
            if (opt.inner) {
                el.innerHTML = opt.inner;
            }
            if (opt.appendTo) {
                opt.appendTo.appendChild(el);
            }
        }
        return el;
    }
    /**
     * FForm function
     */
    function FForm(el, options) {
        this.el = el;
        this.options = extend({}, this.options);
        extend(this.options, options);
        this._init();
    }
    /**
     * FForm options
     */
    FForm.prototype.options = {
        // show progress bar
        ctrlProgress: true,
        // show navigation dots
        ctrlNavDots: true,
        // show [current field]/[total fields] status
        ctrlNavPosition: true,
        // reached the review and submit step
        onReview: function () {
            return false;
        }
    };
    /**
     * init function
     * initialize and cache some vars
     */
    FForm.prototype._init = function () {
        // the form element
        this.formEl = this.el.querySelector('form');
        this.ctrlButton = this.el.querySelector('wz-button');
        // list of fields
        this.fieldsList = this.formEl.querySelector('ol.wz_fields');

        // current field position
        this.current = 0;

        // all fields
        this.fields = [].slice.call(this.fieldsList.children);

        // total fields
        this.fieldsCount = this.fields.length;
        // show first field
        classie.add(this.fields[this.current], 'wz_current');
        // create/add controls
        this._addControls();
        // create/add messages
        this._addErrorMsg();

        // init events
        this._initEvents();
    };

    /**
     * addControls function
     * create and insert the structure for the controls
     */
    FForm.prototype._addControls = function () {
        // main controls wrapper
        this.ctrls = document.querySelector(".wz-controls");
        this.wznum = document.querySelector(".wz-numbers");


        // navigation dots
        if (this.options.ctrlNavDots) {
            this.ctrlNav = createElement('div', {
                cName: 'wz_nav-dots',
                appendTo: this.ctrls
            });
            var dots = '';
            for (var i = 0; i < this.fieldsCount; ++i) {
                //alert(i);
                dots += i === this.current ? '<button class="btn btn-round wz_dot-current"></button>' : '<button class="btn btn-round" disabled></button>';
            }
            this.ctrlNav.innerHTML = dots;
            this._showCtrl(this.ctrlNav);
            this.ctrlNavDots = [].slice.call(this.ctrlNav.children);
        }

        // field number status
        if (this.options.ctrlNavPosition) {
            this.ctrlFldStatus = createElement('span', {
                cName: 'wz_numbers',
                appendTo: this.wznum
            });

            // current field placeholder
            this.ctrlFldStatusCurr = createElement('span', {
                cName: 'wz_number-current',
                inner: Number(this.current + 1)
            });
            this.ctrlFldStatus.appendChild(this.ctrlFldStatusCurr);

            // total fields placeholder
            this.ctrlFldStatusTotal = createElement('span', {
                cName: 'wz_number-total',
                inner: this.fieldsCount
            });
            this.ctrlFldStatus.appendChild(this.ctrlFldStatusTotal);
            this._showCtrl(this.ctrlFldStatus);
        }

        // progress bar
        if (this.options.ctrlProgress) {
            this.ctrlProgress = document.querySelector(".wz_progress");
            this._showCtrl(this.ctrlProgress);
        }
    }

    /**
     * addErrorMsg function
     * create and insert the structure for the error message
     */
    FForm.prototype._addErrorMsg = function () {
        // error message
        this.msgError = createElement('span', {
            cName: 'wz_message-error',
            appendTo: this.el
        });
    }

    /**
     * init events
     */
    FForm.prototype._initEvents = function () {
        var self = this;

        // show next field

        let btn = document.querySelector('.wz-button');

        btn.addEventListener('click', function () {
            self._nextField();
        });




        // navigation dots
        if (this.options.ctrlNavDots) {
            this.ctrlNavDots.forEach(function (dot, pos) {
                dot.addEventListener('click', function () {
                    self._showField(pos);
                });
            });
        }

        // jump to next field without clicking the continue button (for fields/list items with the attribute "data-input-trigger")
        this.fields.forEach(function (fld) {
            if (fld.hasAttribute('data-input-trigger')) {
                var input = fld.querySelector('input[type="radio"]') || /*fld.querySelector( '.cs-select' ) ||*/ fld.querySelector('select'); // assuming only radio and select elements (TODO: exclude multiple selects)
                if (!input) return;

                switch (input.tagName.toLowerCase()) {
                    case 'select':

                        input.addEventListener('change', function () {
                            // self._nextField();
                            getSelectedValue(self)
                            getSelectedcon(self)
                        });
                        break;

                    case 'input':
                        [].slice.call(fld.querySelectorAll('input[type="radio"]')).forEach(function (inp) {
                            inp.addEventListener('change', function (ev) {
                                self._nextField();
                            });
                        });
                        break;

                        /*
                        // for our custom select we would do something like:
                        case 'div' : 
                        	[].slice.call( fld.querySelectorAll( 'ul > li' ) ).forEach( function( inp ) {
                        		inp.addEventListener( 'click', function(ev) { self._nextField(); } );
                        	} ); 
                        	break;
                        */
                }
            }
        });

        // keyboard navigation events - jump to next field when pressing enter
        document.addEventListener('keydown', function (ev) {
            if (!self.isLastStep && ev.target.tagName.toLowerCase() !== 'textarea') {
                var keyCode = ev.keyCode || ev.which;
                if (keyCode === 13) {
                    ev.preventDefault();
                    self._nextField();
                }
            }
        });
    };

    /**
     * nextField function
     * jumps to the next field
     */
    FForm.prototype._nextField = function (backto) {
        if (this.isLastStep || !this._validade() || this.isAnimating) {
            return false;
        }
        this.isAnimating = true;
        console.log(this.current);

        // if (this.current == 3) {
        //     var link = document.getElementById('hide-button');
        //     style.display = 'none';
        //     style.visibility = 'hidden';
        //     var new_ele = document.getElementById('show-email');
        //     new_ele.style.display = 'block';
        // } else {
        //     var link = document.getElementById('hide-button');
        //     link.style.display = 'block';
        //     var new_ele = document.getElementById('show-email');
        //     new_ele.style.display = 'none';
        // }
        // check if on last step
        this.isLastStep = this.current === this.fieldsCount - 1 && backto === undefined ? true : false;

        // clear any previous error messages
        this._clearError();

        // current field
        var currentFld = this.fields[this.current];

        // save the navigation direction
        this.navdir = backto !== undefined ? backto < this.current ? 'prev' : 'next' : 'next';

        // update current field
        this.current = backto !== undefined ? backto : this.current + 1;

        if (backto === undefined) {
            // update progress bar (unless we navigate backwards)
            this._progress();

            // save farthest position so far
            this.farthest = this.current;
        }

        // add class "wz_display-next" or "wz_display-prev" to the list of fields
        classie.add(this.fieldsList, 'wz_display-' + this.navdir);

        // remove class "wz_current" from current field and add it to the next one
        // also add class "wz_show" to the next field and the class "wz_hide" to the current one
        classie.remove(currentFld, 'wz_current');
        classie.add(currentFld, 'wz_hide');

        if (!this.isLastStep) {
            // update nav
            this._updateNav();

            // change the current field number/status
            this._updateFieldNumber();

            var nextField = this.fields[this.current];
            classie.add(nextField, 'wz_current');
            classie.add(nextField, 'wz_show');
        }

        // after animation ends remove added classes from fields
        var self = this,
            onEndAnimationFn = function (ev) {
                if (support.animations) {
                    this.removeEventListener(animEndEventName, onEndAnimationFn);
                }

                classie.remove(self.fieldsList, 'wz_display-' + self.navdir);
                classie.remove(currentFld, 'wz_hide');

                if (self.isLastStep) {
                    // show the complete form and hide the controls
                    self._hideCtrl(self.ctrlNav);
                    self._hideCtrl(self.ctrlProgress);

                    [].forEach.call(document.querySelectorAll('.wz-button'), function (el) {
                        el.style.visibility = 'hidden';
                    });

                    // self._hideCtrl(self.ctrlFldStatus);
                    // // replace class wz_form-full with wz_form-overview
                    // classie.remove(self.formEl, 'wz_form-full');
                    // classie.add(self.formEl, 'wz_form-overview');
                    // classie.add(self.formEl, 'wz_show');
                    // // callback
                    // self.options.onReview();

                } else {
                    classie.remove(nextField, 'wz_show');

                    // if (self.options.ctrlNavPosition) {
                    //     self.ctrlFldStatusCurr.innerHTML = self.ctrlFldStatusNew.innerHTML;
                    //     self.ctrlFldStatus.removeChild(self.ctrlFldStatusNew);
                    //     classie.remove(self.ctrlFldStatus, 'wz_show-' + self.navdir);
                    // }
                }
                self.isAnimating = false;
            };

        if (support.animations) {
            if (this.navdir === 'next') {
                if (this.isLastStep) {
                    currentFld.querySelector('.wz_anim-upper').addEventListener(animEndEventName, onEndAnimationFn);
                } else {
                    nextField.querySelector('.wz_anim-lower').addEventListener(animEndEventName, onEndAnimationFn);
                }
            } else {
                nextField.querySelector('.wz_anim-upper').addEventListener(animEndEventName, onEndAnimationFn);
            }
        } else {
            onEndAnimationFn();
        }
    }

    /**
     * showField function
     * jumps to the field at position pos
     */
    FForm.prototype._showField = function (pos) {
        if (pos === this.current || pos < 0 || pos > this.fieldsCount - 1) {
            return false;
        }
        this._nextField(pos);
    }

    /**
     * updateFieldNumber function
     * changes the current field number
     */
    FForm.prototype._updateFieldNumber = function () {
        if (this.options.ctrlNavPosition) {
            // first, create next field number placeholder
            this.ctrlFldStatusNew = document.createElement('span');
            this.ctrlFldStatusNew.className = 'wz_number-new';
            this.ctrlFldStatusNew.innerHTML = Number(this.current + 1);

            // insert it in the DOM
            this.ctrlFldStatus.appendChild(this.ctrlFldStatusNew);

            // add class "wz_show-next" or "wz_show-prev" depending on the navigation direction
            var self = this;
            setTimeout(function () {
                classie.add(self.ctrlFldStatus, self.navdir === 'next' ? 'wz_show-next' : 'wz_show-prev');
            }, 25);
        }
    }

    /**
     * progress function
     * updates the progress bar by setting its width
     */
    FForm.prototype._progress = function () {
        if (this.options.ctrlProgress) {
            this.ctrlProgress.style.width = this.current * (100 / this.fieldsCount) + '%';
        }
    }

    /**
     * updateNav function
     * updates the navigation dots
     */
    FForm.prototype._updateNav = function () {
        if (this.options.ctrlNavDots) {
            classie.remove(this.ctrlNav.querySelector('button.wz_dot-current'), 'wz_dot-current');
            classie.add(this.ctrlNavDots[this.current], 'wz_dot-current');
            this.ctrlNavDots[this.current].disabled = false;
        }
    }

    /**
     * showCtrl function
     * shows a control
     */
    FForm.prototype._showCtrl = function (ctrl) {
        classie.add(ctrl, 'wz_show');
    }

    /**
     * hideCtrl function
     * hides a control
     */
    FForm.prototype._hideCtrl = function (ctrl) {
        classie.remove(ctrl, 'wz_show');

    }

    // TODO: this is a very basic validation function. Only checks for required fields..
    FForm.prototype._validade = function () {
        var fld = this.fields[this.current],
            input = fld.querySelector('input[required]') || fld.querySelector('textarea[required]') || fld.querySelector('select[required]'),
            error;

        if (!input) return true;

        switch (input.tagName.toLowerCase()) {
            case 'input':
                if (input.type === 'radio' || input.type === 'checkbox') {
                    var checked = 0;
                    [].slice.call(fld.querySelectorAll('input[type="' + input.type + '"]')).forEach(function (inp) {
                        if (inp.checked) {
                            ++checked;
                        }
                    });
                    if (!checked) {
                        error = 'NOVAL';
                    }
                } else if (input.value === '') {
                    error = 'NOVAL';
                }
                break;

            case 'select':
                // assuming here '' or '-1' only
                if (input.value === '' || input.value === '-1') {
                    error = 'NOVAL';
                }
                break;

            case 'textarea':
                if (input.value === '') {
                    error = 'NOVAL';
                }
                break;
        }

        if (error != undefined) {
            this._showError(error);
            return false;
        }

        return true;
    }

    // TODO
    FForm.prototype._showError = function (err) {
        var message = '';
        switch (err) {
            case 'NOVAL':
                message = 'Please fill the field before continuing';
                break;
            case 'INVALIDEMAIL':
                message = 'Please fill a valid email address';
                break;
                // ...
        };
        this.msgError.innerHTML = message;
        this._showCtrl(this.msgError);
    }

    // clears/hides the current error message
    FForm.prototype._clearError = function () {
        this._hideCtrl(this.msgError);
    }

    // add to global namespace
    window.FForm = FForm;

})(window);




// country
function getSelectedValue(self) {
    fetch("countries.json")
        .then(response => response.json())
        .then(data => {
            console.log(data)
            const container = document.getElementById("country");
            const selectedValue = container.value;
            console.log(selectedValue)

            var count = 0;
            data.countries.forEach(country => {
                if (country === selectedValue) {
                    count = 1;
                }
            });
            if (count) {
                var link = document.getElementById('constdata');
                link.style.display = 'block';

                var box = document.getElementById("myBox");
                box.style.display = "none";


                var para = document.getElementById("para1");
                para.style.display = "none";


            } else {
                self._nextField();
            }
        });
}


function getSelectedcon(self) {
    $("input[name$='cars']").click(function () {
        // var test = $(this).val();
        var e = document.getElementById("country");

        var text = e.options[e.selectedIndex].text;
        fetch("list2.json")
            .then(response => response.json())
            .then(data => {

                var count = 0;
                data.countries.forEach(country => {
                    if (country === text) {
                        count = 1;

                    }
                });
                if (count) {
                    var link = document.getElementById('yesdata');
                    link.style.display = 'block';

                    var box = document.getElementById("myBox");
                    box.style.display = "none";

                    var para3 = document.getElementById("para3");
                    para3.style.display = "none";

                    var yesno = document.getElementById("yesno");
                    yesno.style.display = "none";






                } else {

                    self._nextField();
                }
            });


    });
}

// last



$("input[name$='cars1']").click(function (self) {
    // var test = $(this).val();
    var e = document.getElementById("country");
    var value = e.value;
    var text = e.options[e.selectedIndex].text;
    fetch("list3.json")
        .then(response => response.json())
        .then(data => {
            console.log(data)
            var count = 0;
            data.countries.forEach(country => {
                if (country === text) {
                    count = 1;

                }
            });
            if (count) {
 
                var link = document.getElementById('yesdata1');
                link.style.display = 'block';

                var box = document.getElementById("myBox");
                box.style.display = "none";

                var no = document.getElementById("yesno1");
                no.style.display = "none";

                var para2 = document.getElementById("para2");
                para2.style.display = "none";

                // var ques = document.getElementById("ques");
                // ques.style.display = "none";

            } else if (!count) {
                var link = document.getElementById('nodata1');
                link.style.display = 'block';
            } else {
                var link = document.getElementById('nodata2');
                link.style.display = 'block';
            }
        });
    console.log(text);

});