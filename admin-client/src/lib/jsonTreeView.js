/**
 * https://gist.github.com/mudge/5830382#gistcomment-2691957
 */
class EventEmitter {
  constructor() {
    this.events = {};
  }

  _getEventListByName(eventName) {
    if(typeof this.events[eventName] === 'undefined') {
      this.events[eventName] = new Set();
    }
    return this.events[eventName]
  }

  on(eventName, fn) {
    this._getEventListByName(eventName).add(fn);
  }

  once(eventName, fn) {
    const self = this;

    const onceFn = function(...args) {
      self.removeListener(eventName, onceFn);
      fn.apply(self, args);
    };

    this.on(eventName, onceFn);
  }

  emit(eventName, ...args) {
    this._getEventListByName(eventName).forEach(function(fn) {
      fn.apply(this,args);
    }.bind(this));
  }

  removeListener(eventName, fn) {
    this._getEventListByName(eventName).delete(fn);
  }

  removeAllListeners() {
    this.events = {};
  }
}

/**
 * Adapted from https://github.com/luyuan/json-tree-view
 */
function JSONTreeView(name_, value_, parent_, isRoot_) {
  var self = this;
  this.ee = new EventEmitter();
  this.on = (...args) => this.ee.on(...args);
  this.once = (...args) => this.ee.once(...args);
  this.emit = (...args) => this.ee.emit(...args);
  this.removeAllListeners = (...args) => this.ee.removeAllListeners(...args);

	if (typeof isRoot_ === 'undefined' && arguments.length < 4) {
		isRoot_ = true;
	}

	if(arguments.length < 2){
		value_ = name_;
		name_ = undefined;
	}

	var name, value, type, oldType = null, filterText = '', hidden = false,
		readonly = parent_ ? parent_.readonly : true,
		readonlyWhenFiltering = parent_ ? parent_.readonlyWhenFiltering : true,
		alwaysShowRoot = false,
		showCount = parent_ ? parent_.showCountOfObjectOrArray : true,
		includingRootName = true,
		domEventListeners = [], children = [], expanded = false,
		edittingName = false, edittingValue = false,
		nameEditable = true, valueEditable = true;

	var dom = {
		container : document.createElement('div'),
		collapseExpand : document.createElement('div'),
		name : document.createElement('div'),
		separator : document.createElement('div'),
		value : document.createElement('div'),
		spacing: document.createElement('div'),
		// delete : document.createElement('div'),
		children : document.createElement('div'),
		// insert : document.createElement('div')
	};

	Object.defineProperties(self, {
		dom : {
			value : dom.container,
			enumerable : true
		},

		isRoot: {
			get : function(){
				return isRoot_;
			}
		},

		parent: {
			get: function() {
				return parent_;
			}
		},

		children: {
			get: function() {
				var result = null;
				if (type === 'array') {
					result = children;
				}
				else if (type === 'object') {
					result = {};
					children.forEach(function(e) {
						result[e.name] = e;
					});
				}
				return result;
			}
		},

		readonly: {
			get: function() {
				return !!(readonly & 1);
			},
			set: function(ro) {
				readonly = setBit(readonly, 0, +ro);
				!!(readonly & 1) ? dom.container.classList.add('readonly')
						: dom.container.classList.remove('readonly');
				for (var i in children) {
					if (typeof children[i] === 'object') {
						children[i].readonly = setBit(readonly, 0, +ro);
					}
				}
			}
		},

		readonlyWhenFiltering: {
			get: function() {
				return readonlyWhenFiltering;
			},
			set: function(rowf) {
				readonly = setBit(readonly, 1, +rowf);
				readonlyWhenFiltering = rowf;
				(readonly && this.filterText) || !!(readonly & 1)
						? dom.container.classList.add('readonly')
								: dom.container.classList.remove('readonly');
				for (var i in children) {
					if (typeof children[i] === 'object') {
						children[i].readonly = setBit(readonly, 1, +rowf);
						children[i].readonlyWhenFiltering = rowf;
					}
				}
			}
		},

		hidden: {
			get: function() {
				return hidden;
			},
			set: function(h) {
				hidden = h;
				h ? dom.container.classList.add('hidden')
						: dom.container.classList.remove('hidden');
				if (!h) {
					parent_ && (parent_.hidden = h);
				}
			}
		},

		showCountOfObjectOrArray: {
			get: function() {
				return showCount;
			},
			set: function(show) {
				showCount = show;
				for (var i in children) {
					if (typeof children[i] === 'object') {
						children[i].showCountOfObjectOrArray = show;
					}
				}
				(this.type === 'object' || this.type === 'array') && this.updateCount();
			}
		},

		filterText: {
			get: function() {
				return filterText;
			},
			set: function(text) {
				filterText = text;
				if (text) {
					if (readonly > 0) {
						dom.container.classList.add('readonly');
					}
					var key = this.name + '';
					var value = this.value + '';
					if (this.type === 'object' || this.type === 'array') {
						value = '';
					}
					if (key.indexOf(text) > -1 || value.indexOf(text) > -1) {
						this.hidden = false;
					}
					else {
						if (!this.alwaysShowRoot || !isRoot_) {
							this.hidden = true;
						}
					}
				}
				else {
					!this.readonly && dom.container.classList.remove('readonly');
					this.hidden = false;
				}
				for (var i in children) {
					if (typeof children[i] === 'object') {
						children[i].filterText = text;
					}
				}
			}
		},

		alwaysShowRoot: {
			get: function() {
				return alwaysShowRoot;
			},
			set: function(value) {
				if (isRoot_ && this.filterText) {
					this.hidden = !value;
				}
				alwaysShowRoot = value;
				for (var i in children) {
					if (typeof children[i] === 'object') {
						children[i].alwaysShowRoot = value;
					}
				}
			}
		},

		withRootName: {
			get: function() {
				return includingRootName;
			},
			set: function(value) {
				includingRootName = value;
			}
		},

		name : {
			get : function(){
				return name;
			},

			set : setName,
			enumerable : true
		},

		value : {
			get : function(){
				return value;
			},

			set : setValue,
			enumerable : true
		},

		type : {
			get : function(){
				return type;
			},

			enumerable : true
		},

		oldType: {
			get: function () {
				return oldType;
			},

			enumerable: true
		},

		nameEditable : {
			get : function(){
				return nameEditable;
			},

			set : function(value){
				nameEditable = !!value;
			},

			enumerable : true
		},

		valueEditable : {
			get : function(){
				return valueEditable;
			},

			set : function(value){
				valueEditable = !!value;
			},

			enumerable : true
		},

		refresh : {
			value : refresh,
			enumerable : true
		},

		updateCount: {
			value: updateObjectChildCount,
			enumerable: true
		},

		collapse : {
			value : collapse,
			enumerable : true
		},

		expand : {
			value : expand,
			enumerable : true
		},

		destroy : {
			value : destroy,
			enumerable : true
		},

		editName : {
			value : editField.bind(null, 'name'),
			enumerable : true
		},

		editValue : {
			value : editField.bind(null, 'value'),
			enumerable : true
		}

	});


	Object.keys(dom).forEach(function(k){
		if (k === 'delete' && self.isRoot) {
			return;
		}

		var element = dom[k];

		if(k == 'container'){
			return;
		}

		element.className = k;
		if (['name', 'separator', 'value', 'spacing'].indexOf(k) > -1) {
			element.className += ' item';
		}
		dom.container.appendChild(element);
	});

	dom.container.className = 'jsonView';

	addDomEventListener(dom.collapseExpand, 'click', onCollapseExpandClick);
	addDomEventListener(dom.value, 'click', expand.bind(null, false));
	addDomEventListener(dom.name, 'click', expand.bind(null, false));

	addDomEventListener(dom.name, 'dblclick', editField.bind(null, 'name'));
	addDomEventListener(dom.name, 'click', itemClicked.bind(null, 'name'));
	addDomEventListener(dom.name, 'blur', editFieldStop.bind(null, 'name'));
	addDomEventListener(dom.name, 'keypress',
			editFieldKeyPressed.bind(null, 'name'));
	addDomEventListener(dom.name, 'keydown',
			editFieldTabPressed.bind(null, 'name'));

	addDomEventListener(dom.value, 'dblclick', editField.bind(null, 'value'));
	addDomEventListener(dom.value, 'click', itemClicked.bind(null, 'value'));
	addDomEventListener(dom.value, 'blur', editFieldStop.bind(null, 'value'));
	addDomEventListener(dom.value, 'keypress',
			editFieldKeyPressed.bind(null, 'value'));
	addDomEventListener(dom.value, 'keydown',
			editFieldTabPressed.bind(null, 'value'));
	addDomEventListener(dom.value, 'keydown', numericValueKeyDown);

	// addDomEventListener(dom.insert, 'click', onInsertClick);
	// addDomEventListener(dom.delete, 'click', onDeleteClick);

	setName(name_);
	setValue(value_);

	function setBit(n, i, b) {
		var j = 0;
		while ((n >> j << j)) {
			j++;
		}
		return i >= j
				? (n | +b << i )
						: (n >> (i + 1) << (i + 1)) | (n % (n >> i << i)) | (+b << i);
	}

	function squarebracketify(exp) {
		return typeof exp === 'string'
			? exp.replace(/\.([0-9]+)/g, '[$1]') : exp + '';
	}

	function refresh(silent){
		var expandable = type == 'object' || type == 'array';

		children.forEach(function(child){
			child.refresh(true);
		});

		dom.collapseExpand.style.display = expandable ? '' : 'none';

		if(expanded && expandable){
			expand(false, silent);
		}
		else{
			collapse(false, silent);
		}
		if (!silent) {
			self.emit('refresh', self, [self.name], self.value);
		}
	}

	function collapse(recursive, silent){
		if(recursive){
			children.forEach(function(child){
				child.collapse(true, true);
			});
		}

		expanded = false;

		dom.children.style.display = 'none';
		dom.collapseExpand.className = 'expand';
		dom.container.classList.add('collapsed');
		dom.container.classList.remove('expanded');
		if (!silent && (type == 'object' || type == 'array')) {
			self.emit('collapse', self, [self.name], self.value);
		}
	}

	function expand(recursive, silent){
		var keys;

		if(type == 'object'){
			keys = Object.keys(value);
		}
		else if(type == 'array'){
			keys = value.map(function(v, k){
				return k;
			});
		}
		else{
			keys = [];
		}

		// Remove children that no longer exist
		for(var i = children.length - 1; i >= 0; i --){
			var child = children[i];
			if (!child) {
				break;
			}

			if(keys.indexOf(child.name) == -1){
				children.splice(i, 1);
				removeChild(child);
			}
		}

		if(type != 'object' && type != 'array'){
			return collapse();
		}

		keys.forEach(function(key){
			addChild(key, value[key]);
		});

		if(recursive){
			children.forEach(function(child){
				child.expand(true, true);
			});
		}

		expanded = true;
		dom.children.style.display = '';
		dom.collapseExpand.className = 'collapse';
		dom.container.classList.add('expanded');
		dom.container.classList.remove('collapsed');
		if (!silent && (type == 'object' || type == 'array')) {
			self.emit('expand', self, [self.name], self.value);
		}
	}

	function destroy(){
		var child, event;

		while(event = domEventListeners.pop()){
			event.element.removeEventListener(event.name, event.fn);
		}

		while(child = children.pop()){
			removeChild(child);
		}
	}

	function setName(newName){
		var nameType = typeof newName,
			oldName = name;

		if(newName === name){
			return;
		}

		if(nameType != 'string' && nameType != 'number'){
			throw new Error('Name must be either string or number, ' + newName);
		}

		dom.name.innerText = newName;
		name = newName;
		self.emit('rename', self, [name], oldName, newName, true);
	}

	function setValue(newValue){
		var oldValue = value,
			str, len;

		if (isRoot_ && !oldValue) {
			oldValue = newValue;
		}
		type = getType(newValue);
		oldType = oldValue ? getType(oldValue) : type;

		switch(type){
			case 'null':
				str = 'null';
				break;
			case 'undefined':
				str = 'undefined';
				break;
			case 'object':
				len = Object.keys(newValue).length;
				str = showCount ? 'Object[' + len + ']' : (len < 1 ? '{}' : '');
				break;

			case 'array':
				len = newValue.length;
				str = showCount ? 'Array[' + len + ']' : (len < 1 ? '[]' : '');
				break;

			default:
				str = newValue;
				break;
		}

		dom.value.innerText = str;
		dom.value.className = 'value item ' + type;

		if(newValue === value){
			return;
		}

		value = newValue;

		if(type == 'array' || type == 'object'){
			// Cannot edit objects as string because the formatting is too messy
			// Would have to either pass as JSON and force user to wrap properties in quotes
			// Or first JSON stringify the input before passing, this could allow users to reference globals

			// Instead the user can modify individual properties, or just delete the object and start again
			valueEditable = false;

			if(type == 'array'){
				// Obviously cannot modify array keys
				nameEditable = false;
			}
		}

		self.emit('change', self, [name], oldValue, newValue);
		refresh();
	}

	function updateObjectChildCount() {
		var str = '', len;
		if (type === 'object') {
			len = Object.keys(value).length;
			str = showCount ? 'Object[' + len + ']' : (len < 1 ? '{}' : '');
		}
		if (type === 'array') {
			len = value.length;
			str = showCount ? 'Array[' + len + ']' : (len < 1 ? '[]' : '');
		}
		dom.value.innerText = str;
	}

	function addChild(key, val){
		var child;

		for(var i = 0, len = children.length; i < len; i ++){
			if(children[i].name == key){
				child = children[i];
				break;
			}
		}

		if(child){
			child.value = val;
		}
		else{
			child = new JSONTreeView(key, val, self, false);
			child.on('rename', onChildRename);
			child.on('delete', onChildDelete);
			child.on('change', onChildChange);
			child.on('append', onChildAppend);
			child.on('click', onChildClick);
			child.on('expand', onChildExpand);
			child.on('collapse', onChildCollapse);
			child.on('refresh', onChildRefresh);
			children.push(child);
			child.emit('append', child, [key], 'value', val, true);
		}

		dom.children.appendChild(child.dom);

		return child;
	}

	function removeChild(child){
		if(child.dom.parentNode){
			dom.children.removeChild(child.dom);
		}

		child.destroy();
		child.emit('delete', child, [child.name], child.value,
			child.parent.isRoot ? child.parent.oldType : child.parent.type, true);
		child.removeAllListeners();
	}

	function editField(field){
		if((readonly > 0 && filterText) || !!(readonly & 1)) {
			return;
		}
		if(field === 'value' && (type === 'object' || type === 'array')){
			return;
		}
		if(parent_ && parent_.type == 'array'){
			// Obviously cannot modify array keys
			nameEditable = false;
		}
		var editable = field == 'name' ? nameEditable : valueEditable,
			element = dom[field];

		if(!editable && (parent_ && parent_.type === 'array')){
			if (!parent_.inserting) {
				// throw new Error('Cannot edit an array index.');
				return;
			}
		}

		if(field == 'value' && type == 'string'){
			element.innerText = '"' + value + '"';
		}

		if(field == 'name'){
			edittingName = true;
		}

		if(field == 'value'){
			edittingValue = true;
		}

		element.classList.add('edit');
		element.setAttribute('contenteditable', true);
		element.focus();
		document.execCommand('selectAll', false, null);
	}

	function itemClicked(field) {
		self.emit('click', self,
			!self.withRootName && self.isRoot ? [''] : [self.name], self.value);
	}

	function editFieldStop(field){
		var element = dom[field];
		
		if(field == 'name'){
			if(!edittingName){
				return;
			}
			edittingName = false;
		}

		if(field == 'value'){
			if(!edittingValue){
				return;
			}
			edittingValue = false;
		}
		
		if(field == 'name'){
			var p = self.parent;
			var edittingNameText = element.innerText;
			if (p && p.type === 'object' && edittingNameText in p.value) {
				element.innerText = name;
				element.classList.remove('edit');
				element.removeAttribute('contenteditable');
				// throw new Error('Name exist, ' + edittingNameText);
			}
			else {
				setName.call(self, edittingNameText);
			}
		}
		else{
			var text = element.innerText;
			try{
				setValue(text === 'undefined' ? undefined : JSON.parse(text));
			}
			catch(err){
				setValue(text);
			}
		}

		element.classList.remove('edit');
		element.removeAttribute('contenteditable');
	}

	function editFieldKeyPressed(field, e){
		switch(e.key){
			case 'Escape':
			case 'Enter':
				editFieldStop(field);
				break;
		}
	}

	function editFieldTabPressed(field, e){
		if(e.key == 'Tab'){
			editFieldStop(field);

			if(field == 'name'){
				e.preventDefault();
				editField('value');
			}
			else{
				editFieldStop(field);
			}
		}
	}

	function numericValueKeyDown(e){
		var increment = 0, currentValue;

		if(type != 'number'){
			return;
		}

		switch(e.key){
			case 'ArrowDown':
			case 'Down':
				increment = -1;
				break;

			case 'ArrowUp':
			case 'Up':
				increment = 1;
				break;
		}

		if(e.shiftKey){
			increment *= 10;
		}

		if(e.ctrlKey || e.metaKey){
			increment /= 10;
		}

		if(increment){
			currentValue = parseFloat(dom.value.innerText);

			if(!isNaN(currentValue)){
				setValue(Number((currentValue + increment).toFixed(10)));
			}
		}
	}

	function getType(value){
		var type = typeof value;

		if(type == 'object'){
			if(value === null){
				return 'null';
			}

			if(Array.isArray(value)){
				return 'array';
			}
		}
		if (type === 'undefined') {
			return 'undefined';
		}

		return type;
	}

	function onCollapseExpandClick(){
		if(expanded){
			collapse();
		}
		else{
			expand();
		}
	}

	function onInsertClick(){
		var newName = type == 'array' ? value.length : undefined,
			child = addChild(newName, null);
		if (child.parent) {
			child.parent.inserting = true;
		}
		if(type == 'array'){
			value.push(null);
			child.editValue();
			child.emit('append', self, [value.length - 1], 'value', null, true);
			if (child.parent) {
				child.parent.inserting = false;
			}
		}
		else{
			child.editName();
		}
	}

	function onDeleteClick(){
		self.emit('delete', self, [self.name], self.value,
			self.parent.isRoot ? self.parent.oldType : self.parent.type, false);
	}

	function onChildRename(child, keyPath, oldName, newName, original){
		var allow = newName && type != 'array' && !(newName in value) && original;
		if(allow){
			value[newName] = child.value;
			delete value[oldName];
			if (self.inserting) {
				child.emit('append', child, [newName], 'name', newName, true);
				self.inserting = false;
				return;
			}
		}
		else if(oldName === undefined){
			// A new node inserted via the UI
			original && removeChild(child);
		}
		else if (original){
			// Cannot rename array keys, or duplicate object key names
			child.name = oldName;
			return;
		}
		// value[keyPath] = newName;

		// child.once('rename', onChildRename);

		if (self.withRootName || !self.isRoot) {
			keyPath.unshift(name);
		}
		else if (self.withRootName && self.isRoot) {
			keyPath.unshift(name);
		}
		if (oldName !== undefined) {
			self.emit('rename', child, keyPath, oldName, newName, false);
		}
	}

	function onChildAppend(child, keyPath, nameOrValue, newValue, sender){
		if (self.withRootName || !self.isRoot) {
			keyPath.unshift(name);
		}
		self.emit('append', child, keyPath, nameOrValue, newValue, false);
		sender && updateObjectChildCount();
	}

	function onChildChange(child, keyPath, oldValue, newValue, recursed){
		if(!recursed){
			value[keyPath] = newValue;
		}

		if (self.withRootName || !self.isRoot) {
			keyPath.unshift(name);
		}
		self.emit('change', child, keyPath, oldValue, newValue, true);
	}

	function onChildDelete(child, keyPath, deletedValue, parentType, passive){
		var key = child.name;

		if (passive) {
			if (self.withRootName/* || !self.isRoot*/) {
				keyPath.unshift(name);
			}
			self.emit('delete', child, keyPath, deletedValue, parentType, passive);
			updateObjectChildCount();
		}
		else {
			if (type == 'array') {
				value.splice(key, 1);
			}
			else {
				delete value[key];
			}
			refresh(true);
		}
	}

	function onChildClick(child, keyPath, value) {
		if (self.withRootName || !self.isRoot) {
			keyPath.unshift(name);
		}
		self.emit('click', child, keyPath, value);
	}

	function onChildExpand(child, keyPath, value) {
		if (self.withRootName || !self.isRoot) {
			keyPath.unshift(name);
		}
		self.emit('expand', child, keyPath, value);
	}

	function onChildCollapse(child, keyPath, value) {
		if (self.withRootName || !self.isRoot) {
			keyPath.unshift(name);
		}
		self.emit('collapse', child, keyPath, value);
	}

	function onChildRefresh(child, keyPath, value) {
		if (self.withRootName || !self.isRoot) {
			keyPath.unshift(name);
		}
		self.emit('refresh', child, keyPath, value);
	}

	function addDomEventListener(element, name, fn){
		element.addEventListener(name, fn);
		domEventListeners.push({element : element, name : name, fn : fn});
  }
}

export default JSONTreeView;