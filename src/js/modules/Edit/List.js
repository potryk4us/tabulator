import maskInput from './inputMask.js';

export default class Edit{
    constructor(editor, cell, onRendered, success, cancel, editorParams){
        this.edit = editor;
        this.table = editor.table;
        this.cell = cell;
        this.params = this._initializeParams(editorParams);
        
        this.data = [];
        this.displayItems = [];
        this.currentItems = [];
        this.focusedItem = null;
        
        this.input = this._createInputElement();
        this.listEl = this._createListElement();
        
        this.initialValues = this.params.multiselect ? cell.getValue() : [cell.getValue()];
        
        this.filterTimeout = null;
        this.filtered = false;
        
        this.values = []; 
        this.popup = null;  
        
        this.blurable = true;
        
        this.actions = {
            success:success,
            cancel:cancel
        }
        
        onRendered(this._onRendered.bind(this));
    }
    
    _onRendered(){
        var cellEl = this.cell.getElement();
        
        function clickStop(e){
            e.stopPropagation();
        }
        
        this.input.style.height = "100%";
        this.input.focus({preventScroll: true});
        
        
        cellEl.addEventListener("click", clickStop);
        
        setTimeout(() => {
            cellEl.removeEventListener("click", clickStop);
        }, 1000)
    }
    
    _createListElement(){
        var listEl = document.createElement("div");
        listEl.classList.add("tabulator-edit-select-list");
        
        listEl.style.minWidth = this.cell.getElement().offsetWidth + "px";
        
        listEl.addEventListener("mousedown", this._preventBlur.bind(this));
        listEl.addEventListener("keydown", this._inputKeyDown.bind(this))
        
        return listEl;
    }
    
    _createInputElement(){
        var attribs = this.params.elementAttributes;
        var input = document.createElement("input");
        
        input.setAttribute("type", this.params.clearable ? "search" : "text");
        
        input.style.padding = "4px";
        input.style.width = "100%";
        input.style.boxSizing = "border-box";
        
        if(!this.params.autocomplete){
            input.style.cursor = "default";
            input.style.caretColor = "transparent";
            // input.readOnly = (this.edit.currentCell != false);
        }
        
        if(attribs && typeof attribs == "object"){
            for (let key in attribs){
                if(key.charAt(0) == "+"){
                    key = key.slice(1);
                    input.setAttribute(key, input.getAttribute(key) + attribs["+" + key]);
                }else{
                    input.setAttribute(key, attribs[key]);
                }
            }
        }
        
        if(this.params.mask){
            maskInput(input, this.params);
        }

        this._bindInputEvents(input);
        
        return input;
    }
    
    _initializeParams(params){
        params = Object.assign({}, params);
        
        params.verticalNavigation = params.verticalNavigation || "editor";
        
        return params;
    }
    //////////////////////////////////////
    ////////// Event Handling ////////////
    //////////////////////////////////////
    
    _bindInputEvents(input){
        input.addEventListener("focus", this._inputFocus.bind(this))
        input.addEventListener("click", this._inputClick.bind(this))
        input.addEventListener("blur", this._inputBlur.bind(this))
        input.addEventListener("keydown", this._inputKeyDown.bind(this))
        input.addEventListener("search", this._inputSearch.bind(this))
        
        if(this.params.autocomplete){
            input.addEventListener("keyup", this._inputKeyUp.bind(this))
        }
    }
    
    
    _inputFocus(e){
        this.rebuildOptionsList();
    }
    
    _filter(){
        if(this.params.ajaxURL){
            this.rebuildOptionsList();
        }else{
            this._filterList();
        }
    }
    
    _inputClick(e){
        e.stopPropagation();
    }
    
    _inputBlur(e){
        if(this.blurable && this.popup){
            this.popup.hide();
        }
    }
    
    _inputSearch(){
        this._clearChoices();
    }
    
    _inputKeyDown(e){
        switch(e.keyCode){
            
            case 38: //up arrow
            this._keyUp(e);
            break
            
            case 40: //down arrow
            this._keyDown(e);
            break;
            
            case 37: //left arrow
            case 39: //right arrow
            this._keySide(e);
            break;
            
            case 13: //enter
            this._keyEnter();
            break;
            
            case 27: //escape
            this._keyEsc();
            break;
            
            case 36: //home
            case 35: //end
            this._keyHomeEnd(e);
            break;
            
            case 9: //tab
            break;
            
            default:
            this._keySelectLetter(e);
        }
    }
    
    _inputKeyUp(e){
        switch(e.keyCode){
            case 38: //up arrow
            case 37: //left arrow
            case 39: //up arrow
            case 40: //right arrow
            case 13: //enter
            case 27: //escape
            break;
            
            default:
            this._keyAutoCompLetter(e);
        }
    }
    
    _preventBlur(){
        this.blurable = false;
        
        setTimeout(function(){
            this.blurable = true;
        }, 10);
    }
    
    //////////////////////////////////////
    //////// Keyboard Navigation /////////
    //////////////////////////////////////
    
    _keyUp(e){
        var index = this.displayItems.indexOf(this.focusedItem);
        
        if(this.params.verticalNavigation == "editor" || (this.params.verticalNavigation == "hybrid" && index)){
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
            
            if(index > 0){
                this._focusItem(this.displayItems[index - 1]);
            }
        }
    }
    
    _keyDown(e){
        var index = this.displayItems.indexOf(this.focusedItem);
        
        if(this.params.verticalNavigation == "editor" || (this.params.verticalNavigation == "hybrid" && index < this.displayItems.length - 1)){
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
            
            if(index < this.displayItems.length - 1){
                if(index == -1){
                    this._focusItem(this.displayItems[0]);
                }else{
                    this._focusItem(this.displayItems[index + 1]);
                }
            }
        }
    }
    
    _keySide(e){
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();
    }
    
    _keyEnter(e){
        if(this.focusedItem){
            this._chooseItem(this.focusedItem);
        }else{
            this.cancel();
        }
    }
    
    _keyEsc(e){
        this._cancel();
    }
    
    _keyHomeEnd(e){
        if(this.params.autocomplete){
            //prevent table navigation while using input element
            e.stopImmediatePropagation();
        }
    }
    
    _keySelectLetter(e){
        if(!this.params.autocomplete){
            // if(this.edit.currentCell === false){
            e.preventDefault();
            // }
            
            if(e.keyCode >= 38 && e.keyCode <= 90){
                this._scrollToValue(e.keyCode);
            }
        }
    }
    
    _keyAutoCompLetter(e){
        this._filter();
    }
    
    
    _scrollToValue(char){
        clearTimeout(this.filterTimeout);
        
        var character = String.fromCharCode(char).toLowerCase();
        this.filterTerm += character.toLowerCase();
        
        var match = this.displayItems.find((item) => {
            return typeof item.label !== "undefined" && item.label.toLowerCase().startsWith(this.filterTerm);
        });
        
        if(match){
            this._focusItem(match);
        }
        
        this.filterTimeout = setTimeout(() => {
            this.filterTerm = "";
        }, 800)
    }
    
    _focusItem(item){
        if(this.focusedItem && this.focusedItem.element){
            this.focusedItem.element.classList.remove("focused");
        }
        
        this.focusedItem = item;
        
        if(item && item.element){
            item.element.classList.add("focused");
            item.element.scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'start'});
        }
    }
    
    
    //////////////////////////////////////
    /////// Data List Generation /////////
    //////////////////////////////////////
    
    rebuildOptionsList(){
        this._generateOptions()
        .then(this._sortOptions.bind(this))
        .then(this._buildList.bind(this))
        .then(this._showList.bind(this))
    }
    
    _filterList(){
        this._buildList(this._filterOptions());
        this._showList();
    }
    
    _generateOptions(){
        var paramValues = this.params.values;
        
        this.filtered = false;
        
        //TODO - Handle AJAX;
        
        if(typeof paramValues === "function"){
            paramValues = paramValues(cell);
        }
        
        if(paramValues instanceof Promise){
            return paramValues.then(this._lookupValues.bind(this))
        }else{
            return Promise.resolve(this._lookupValues(paramValues));
        }
    }
    
    _lookupValues(paramValues){
        if(paramValues === true){
            paramValues = this._uniqueColumnValues();//lookup this column
        }else if(typeof paramValues === "string"){
            paramValues = this._uniqueColumnValues(paramValues);//lookup specific column
        }
        
        return this._parseList(paramValues);
    }
    
    _uniqueColumnValues(field){
        var output = {},
        data = this.table.getData(this.params.valueLookupRange),
        column;
        
        if(field){
            column = this.table.columnManager.getColumnByField(field);
        }else{
            column = this.cell.getColumn()._getSelf();
        }
        
        if(column){
            data.forEach((row) => {
                var val = column.getFieldValue(row);
                
                if(val !== null && typeof val !== "undefined" && val !== ""){
                    output[val] = true;
                }
            });
        }else{
            console.warn("unable to find matching column to create select lookup list:", field);
            output = [];
        }
        
        return Object.keys(output);
    }
    
    
    _parseList(inputValues){
        var data = [];
        
        if(!Array.isArray(inputValues)){
            inputValues = Object.entries(inputValues).map(([key, value]) => {
                return {
                    label:value,
                    value:key,
                };
            });
        }
        
        inputValues.forEach((value) => {
            if(typeof value !== "object"){
                value = {
                    label:value,
                    value:value,
                    element:false,
                };
            }
            
            this._parseListItem(value, data);
        });
        
        this.data = data;
        
        return data;    
    }
    
    _parseListItem(option, data){
        var item = {};
        
        if(option.options){
            this._parseListGroup(option);
        }else{
            item = {
                label:option.label,
                value:option.value,
                itemParams:option.itemParams,
                elementAttributes: option.elementAttributes,
                element:false,
                selected:false,
                visible:true,
            };
            
            data.push(item);
            
            if(this.initialValues && this.initialValues.indexOf(option.value) > -1){
                this._chooseItem(item, true);
            }
        }
    }
    
    _parseListGroup(option, data){
        var item = {
            label:option.label,
            group:true,
            itemParams:option.itemParams,
            elementAttributes:option.elementAttributes,
            element:false,
            visible:true,
            options:[],
        };
        
        data.push(item);
        
        option.options.forEach((child) => {
            this._parseListItem(child, item.options);
        });
    }
    
    _sortOptions(options){
        var sorter;
        
        if(this.params.sort){
            sorter = typeof this.params.sort === "function" ? this.params.sort : this._defaultSortFunction.bind(this);
            
            this._sortGroup(sorter, options);
        }
        
        return options;
    }
    
    _sortGroup(sorter, options){
        options.sort((a,b) => {
            return sorter(a.label, b.label, a, b);
        });
        
        options.forEach((option) => {
            if(option.group){
                this._sortGroup(sorter, option.options);
            }
        })
    }
    
    _defaultSortFunction(as, bs){
        var a, b, a1, b1, i= 0, L, rx = /(\d+)|(\D+)/g, rd = /\d/;
        var emptyAlign = 0;

        if(this.params.sort === "desc"){
            [as, bs] = [bs, as];
        }
        
        //handle empty values
        if(!as && as!== 0){
            emptyAlign =  !bs && bs!== 0 ? 0 : -1;
        }else if(!bs && bs!== 0){
            emptyAlign =  1;
        }else{
            if(isFinite(as) && isFinite(bs)) return as - bs;
            a = String(as).toLowerCase();
            b = String(bs).toLowerCase();
            if(a === b) return 0;
            if(!(rd.test(a) && rd.test(b))) return a > b ? 1 : -1;
            a = a.match(rx);
            b = b.match(rx);
            L = a.length > b.length ? b.length : a.length;
            while(i < L){
                a1= a[i];
                b1= b[i++];
                if(a1 !== b1){
                    if(isFinite(a1) && isFinite(b1)){
                        if(a1.charAt(0) === "0") a1 = "." + a1;
                        if(b1.charAt(0) === "0") b1 = "." + b1;
                        return a1 - b1;
                    }
                    else return a1 > b1 ? 1 : -1;
                }
            }
            
            return a.length > b.length;
        }
        
        return emptyAlign;
    }
    
    _filterOptions(){
        var filterFunc = this.params.filterFunc || this._defaultFilterFunc;
        var term = this.input.value;
        var results = [];
        
        if(term){
            this.filtered = true;
            
            this.data.forEach((item) => {
                this._filterItem(filterFunc, term, item);
            });
        }else{
            this.filtered = false;
        }
        
        return this.data;
    }
    
    _filterItem(func, term, item){
        var matches = false;
        
        if(!item.group){
            item.visible = func(term, item);
        }else{
            item.options.forEach((option) => {
                if(this._filterItem(func, term, option)){
                    matches = true;
                }
            });
            
            item.visible = matches;
        }
        
        return item.visible;
    }
    
    _defaultFilterFunc(term, item){
        var term = String(term).toLowerCase();
        
        if(item.value !== null || typeof item.value !== "undefined"){
            if(String(item.value).toLowerCase().indexOf(term) > -1 || String(item.label).toLowerCase(term).indexOf() > -1){
                return true;
            }
        }
        
        return false;
    }
    
    //////////////////////////////////////
    /////////// Display List /////////////
    //////////////////////////////////////
    
    _clearList(){
        while(this.listEl.firstChild) this.listEl.removeChild(this.listEl.firstChild);
        
        this.displayItems = [];
    }
    
    _buildList(data){
        this._clearList();
        
        data.forEach((option) => {
            this._buildItem(option);
        });
    }
    
    _buildItem(item){
        var el = item.element,
        contents;
        
        if(!this.filtered || item.visible){
            
            if(!el){
                el = document.createElement("div");
                el.tabIndex = 0;
                
                contents = this.params.listItemFormatter ? this.params.listItemFormatter(item, el) : item.label;
                
                if(contents instanceof HTMLElement){
                    el.appendChild(contents)
                }else{
                    el.innerHTML = contents;
                }
                
                if(item.group){
                    el.classList.add("tabulator-edit-select-list-group");
                }else{
                    el.classList.add("tabulator-edit-select-list-item");
                }
                
                if(item.elementAttributes && typeof item.elementAttributes == "object"){
                    for (let key in item.elementAttributes){
                        if(key.charAt(0) == "+"){
                            key = key.slice(1);
                            el.setAttribute(key, this.input.getAttribute(key) + item.elementAttributes["+" + key]);
                        }else{
                            el.setAttribute(key, item.elementAttributes[key]);
                        }
                    }
                }
                
                el.addEventListener("click", this._itemClick.bind(this, item));
                el.addEventListener("mousedown", this._preventBlur.bind(this));
                
                item.element = el;
            }
            
            this._styleItem(item);
            
            this.listEl.appendChild(el);
            
            if(item.group){
                item.options.forEach((option) => {
                    this._buildItem(option);
                });
            }else{
                this.displayItems.push(item);
            }
        }
    }
    
    _showList(){
        if(!this.popup){
            this.popup = this.edit.popup(this.listEl);
        }
        
        if(!this.popup.isVisible()){
            this.popup.show(this.cell.getElement(), "bottom").hideOnBlur(this._resolveValue.bind(this));
        }
    }
    
    _styleItem(item){
        if(item && item.element){
            if(item.selected){
                item.element.classList.add("active");
            }else{
                item.element.classList.remove("active");
            }
        }
    }
    
    //////////////////////////////////////
    ///////// User Interaction ///////////
    //////////////////////////////////////
    
    _itemClick(item, e){
        //select element
        e.stopPropagation();
        
        this._chooseItem(item);
    }
    
    //////////////////////////////////////
    ////// Current Item Management ///////
    //////////////////////////////////////
    
    _cancel(){
        this.popup.hide(true);
        this.actions.cancel();
    }
    
    _clearChoices(){
        this.currentItems.forEach((item) => {
            item.selected = false;
            this._styleItem(item);
        });
        
        this.currentItems = [];
        
        this._focusItem = null;
    }
    
    _chooseItem(item, silent){
        var index;
        
        if(this.params.multiselect){
            index = this.currentItems.indexOf(item);
            
            if(index > -1){
                this.currentItems.splice(index, 1);
                item.selected = false;
            }else{
                this.currentItems.push(item);
                item.selected = true;
            }
            
            this.input.value = this.currentItems.map(item => item.value).join(",");
            
            this._styleItem(item);
            
        }else{
            this.currentItems = [item];
            item.selected = true;
            
            this.input.value = item.value;
            
            if(!silent){
                this._resolveValue();
            }
        }
        
        this._focusItem(item);
    }
    
    _resolveValue(){
        this.popup.hide(true);
        
        if(this.params.multiselect){
            this.actions.success(this.currentItems.map(item => item.value));
        }else{
            this.actions.success(this.currentItems[0] ? this.currentItems[0].value : "");
        }
    }
    
}