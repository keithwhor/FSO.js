/* Copyright (c) 2014 Keith Horwood | The MIT License (MIT) | https://raw.github.com/keithwhor/FSO.js/master/LICENSE */
(function () {

	var fsoChunkSize = 1024 * 1024 * 2;
	var fsoEmptyChunk = new Blob([new ArrayBuffer(fsoChunkSize)]);
	var fsoZeroChunk = new Blob([new ArrayBuffer(0)]);
	var fsoStates = {
		INITIALIZING: 0,
		READY: 1,
		EXECUTING: 2,
		COMPLETE: 4,
		ERROR: 9
	};

	var fsoBuffer = function(data, offset, error) {
		var i = 0;
		var buffered = [fsoZeroChunk];
		offset = Math.abs(parseInt(offset) || 0);
		offset %= fsoChunkSize;
		var len;

		if(!data) {
			return [new Blob([new ArrayBuffer(offset)])];
		} else if(typeof(data)==='string') {
			var str = data;
			data = [];
			data.length = str.length;
			for(var j=0,jlen=data.length;j<jlen;j++) {
				data[j] = str.charCodeAt(j);
			}
			data = new Uint8Array(data).buffer;
			len = data.byteLength;
		} else if(data instanceof Array) {
			data = new UInt8Array(data).buffer;
			len = data.byteLength;
		} else if(data instanceof ArrayBuffer) {
			len = data.byteLength;
		} else if(data.buffer && data.buffer instanceof ArrayBuffer) {
			data = data.buffer;
			len = data.byteLength;
		} else {
			if(typeof(error)==='function') {
				error('Data incorrectly formatted');
			}
			throw new Error('Data incorrectly formatted');
		}

		var size;
		var begin;

		if(offset + len > 0) {

			buffered = [];
			buffered.length = (Math.ceil((len + offset) / fsoChunkSize));

			size = Math.min(fsoChunkSize - offset, len);

			buffered[i++] = new Blob(
				[new ArrayBuffer(offset), new Int8Array(data, 0, size)]
			);

			len -= size;
			begin = size;

			while(len > fsoChunkSize) {
				buffered[i++] = new Blob([new Int8Array(data, begin, fsoChunkSize)]);
				begin += fsoChunkSize;
				len -= fsoChunkSize;
			}

			buffered[i] = new Blob([new Int8Array(data, begin, len)]);

		}

		return buffered;

	};

	var fsoParsePath = function(path) {
		if(path.indexOf('/') !== 0) {
			path = '/' + path;
		}
		return path;
	};

	var FileSystemUtil = {
		prettySize: function(bytes) {
			var metric = ['', 'k', 'M', 'G', 'T', 'P', 'E'];
			var sz = (Math.log(bytes) / Math.log(1024)) | 0;
			return (Math.round(bytes * 100 / Math.pow(1024, sz)) / 100) + metric[sz] + 'B';
		},
		prettyDirectory: function(entry, depth) {

			depth |= 0;
			var rows = [];
			var text = '';

			var textArray = [];
			textArray.length = (depth * 2) + 1;
			text += textArray.join(' ');

			text += (entry.isFile?'  -':' ') + ' ' +
				(entry.isFile?entry.name:'[' + entry.name + ']') + (entry.isFile?' (' + FileSystemUtil.prettySize(entry.size) + ')':'');

			rows.push(text);
			if(entry.isDirectory) {
				entry.children.sort(function(a, b) {
					if(a.isFile === b.isFile) {
						return a.name > b.name;
					} else {
						return a.isFile < b.isFile;
					}
				});
				for(var i=0,len=entry.children.length;i<len;i++) {
					var curEntry = entry.children[i];
					rows = rows.concat(FileSystemUtil.prettyDirectory(curEntry, depth + 1));
				}
			}

			return depth>0?rows:rows.join(String.fromCharCode(10));

		}
	};

	var fsoCommands = {
		getBytes: function(callback) {
			var errorHandler = this.__error__.bind(this, {name: 'getBytes'});
			var execute = this.__execute__.bind(this, callback);

			var fso = this.parent;

			if(this.parent.persistent) {
				navigator.webkitPersistentStorage.queryUsageAndQuota(
					function(used, available) {
						fso.availableBytes = available;
						execute(used, available);
					},
					errorHandler
				);
			} else {
				navigator.webkitTemporaryStorage.queryUsageAndQuota(
					function(used, available) {
						fso.availableBytes = available;
						execute(used, available);
					},
					errorHandler
				);
			}

		},
		info: function(path, callback) {
			var errorHandler = this.__error__.bind(this, {name: 'info', path: path});
			var execute = this.__execute__.bind(this, callback);
			
			var getDir, getFile;
			var fs = this.fs;
			var toURL = this.parent.toURL.bind(this.parent);

			var getInfo = function(data) {
				var obj = {
					name: this.name,
					fullPath: this.fullPath,
					url: toURL(this.fullPath),
					isDirectory: this.isDirectory,
					isFile: this.isFile,
					size: data.size,
					modified: data.modificationTime
				};
				execute(obj);
			};

			getFile = function() {
				fs.root.getFile(
					path,
					{},
					function(fileEntry) {
						fileEntry.getMetadata(
							getInfo.bind(fileEntry),
							errorHandler
						);
					},
					errorHandler
				);
			};

			getDir = function() {
				fs.root.getDirectory(
					path,
					{},
					function(dirEntry) {
						dirEntry.getMetadata(
							getInfo.bind(dirEntry),
							errorHandler
						);
					},
					function(e) {
						if(e.name === 'TypeMismatchError') {
							getFile();
						} else {
							errorHandler(e);
						}
					}
				);
			};

			getDir();

		},
		read: function(filename, callback) {
			var errorHandler = this.__error__.bind(this, {name: 'read', path: filename});
			var execute = this.__execute__.bind(this, callback);
			this.fs.root.getFile(
				filename,
				{},
				function(fileEntry) {
					fileEntry.file(
						function(file) {
							var reader = new FileReader();
							reader.onloadend = function() {
								execute(this.result);
							};	
							reader.readAsText(file);
						},
						errorHandler
					);
				},
				errorHandler
			);
		},
		readBuffer: function(filename, callback) {
			var errorHandler = this.__error__.bind(this, {name: 'read', path: filename});
			var execute = this.__execute__.bind(this, callback);
			this.fs.root.getFile(
				filename,
				{},
				function(fileEntry) {
					fileEntry.file(
						function(file) {
							var reader = new FileReader();
							reader.onloadend = function() {
								execute(this.result);
							};	
							reader.readAsArrayBuffer(file);
						},
						errorHandler
					);
				},
				errorHandler
			);
		},
		put: function(file, path, name, callback) {

			var errorHandler = this.__error__.bind(this, {name: 'put', path: path});
			var execute = this.__execute__.bind(this, callback);

			if(path.substr(-1)!=='/') {
				path += '/';
			}

			if(!name) {
				name = null;
			}

			if(!(file instanceof File)) {
				errorHandler('Invalid file');
			}

			this.fs.root.getFile(
				path + (name?name:file.name),
				{create: true, exclusive: false},
				function(fileEntry) {
					fileEntry.createWriter(
						function(fileWriter) {
							fileWriter.onerror = errorHandler;
							fileWriter.truncate(0);
							fileWriter.onwriteend = function() {
								fileWriter.seek(0);
								fileWriter.write(file);
								fileWriter.onwriteend = execute;
							};
						},
						errorHandler
					);
				},
				errorHandler
			);
		},
		write: function(filename, data, callback) {
			var errorHandler = this.__error__.bind(this, {name: 'write', path: filename});
			var execute = this.__execute__.bind(this, callback);

			this.fs.root.getFile(
				filename,
				{create: true, exclusive: false},
				function(fileEntry) {
					fileEntry.createWriter(
						function(fileWriter) {
							fileWriter.onerror = errorHandler;
							fileWriter.truncate(0);
							fileWriter.onwriteend = function() {
								var blobs = fsoBuffer(data, 0, errorHandler);

								var count = blobs.length - 1;

								var i = 0;
								var cont = function() {
									fileWriter.seek(i * fsoChunkSize);
									fileWriter.write(blobs[i++], errorHandler);
								};
								var check = [cont, execute];

								var expand = function() {
									check[(count - i) >>> 31]();
								};

								fileWriter.onwriteend = expand;
								expand();
							};
						},
						errorHandler
					);
				},
				errorHandler
			);
		},
		insert: function(filename, data, index, callback) {
			var errorHandler = this.__error__.bind(this, {name: 'insert', path: filename});
			var execute = this.__execute__.bind(this, callback);

			index = Number(index);
			index = isNaN(index)?0:Math.max(0, index);

			this.fs.root.getFile(
				filename,
				{create: true, exclusive: false},
				function(fileEntry) {
					fileEntry.createWriter(
						function(fileWriter) {
							fileWriter.onerror = errorHandler;
							var len = fileWriter.length || 0;
							var blobs;

							var chunkCount = Math.floor((index - len) / fsoChunkSize);

							if(chunkCount) {

								var mod = 1;
								var arr = [fsoEmptyChunk];
								var sz = chunkCount;
								blobs = [];
								while(sz > 0) {
									if(sz % (2*mod) === mod) {
										blobs = blobs.concat(arr);
										sz -= mod;
									}
									arr = arr.concat(arr);
									mod *= 2;
								}

								blobs = blobs.concat(fsoBuffer(data, index - (chunkCount * fsoChunkSize), errorHandler));
							
							} else {

								blobs = fsoBuffer(data, Math.max(0, index - len), errorHandler);

							}

							var count = blobs.length - 1;

							var i = 0;
							var cont = function() {
								fileWriter.seek(index + (i * fsoChunkSize));
								fileWriter.write(blobs[i++], errorHandler);
							};
							var check = [cont, execute];

							var expand = function() {
								check[(count - i) >>> 31]();
							};

							fileWriter.onwriteend = expand;
							expand();

						},
						errorHandler
					);
				},
				errorHandler
			);
		},
		append: function(filename, data, callback) {
			var errorHandler = this.__error__.bind(this, {name: 'append', path: filename});
			var execute = this.__execute__.bind(this, callback);
			this.fs.root.getFile(
				filename,
				{create: true, exclusive: false},
				function(fileEntry) {
					fileEntry.createWriter(
						function(fileWriter) {
							fileWriter.onerror = errorHandler;
							var len = fileWriter.length;
							var blobs = fsoBuffer(data, 0, errorHandler);
							var count = blobs.length - 1;

							var i = 0;
							var cont = function() {
								fileWriter.seek(len + (i * fsoChunkSize));
								fileWriter.write(blobs[i++], errorHandler);
							};
							var check = [cont, execute];

							var expand = function() {
								check[(count - i) >>> 31]();
							};

							fileWriter.onwriteend = expand;
							expand();
						},
						errorHandler
					);
				},
				errorHandler
			);
		},
		rm: function(filename, callback) {
			var errorHandler = this.__error__.bind(this, {name: 'rm', path: filename});
			var execute = this.__execute__.bind(this, callback);
			var getDir, getFile;
			var fs = this.fs;

			getFile = function() {
				fs.root.getFile(
					filename,
					{},
					function(fileEntry) {
						fileEntry.remove(
							execute.bind(null, true),
							errorHandler
						);
					},
					function(e) {
						if(e.name === 'NotFoundError') {
							execute();
						} else {
							errorHandler(e);
						}
					}
				);
			};

			getDir = function() {
				fs.root.getDirectory(
					filename,
					{},
					function(dirEntry) {
						dirEntry.remove(
							execute,
							function(e) {
								if(e.name === 'InvalidModificationError') {
									errorHandler('Directory non-empty, please use .rmdir for recursive directory removal');
								} else {
									errorHandler(e);
								}
							}
						);
					},
					function(e) {
						if(e.name === 'NotFoundError') {
							execute();
						} else if(e.name === 'TypeMismatchError') {
							getFile();
						} else {
							errorHandler(e);
						}
					}
				);
			};

			getDir();

		},
		mkdir: function(dirname, callback) {
			var errorHandler = this.__error__.bind(this, {name: 'mkdir', path: dirname});
			var execute = this.__execute__.bind(this, callback);
			var dirs = dirname.split('/');
			var create = [];

			var makeDir;

			var fs = this.fs;

			makeDir = function() {
				fs.root.getDirectory(
					dirs.join('/'),
					{create: true},
					function() {
						if(create.length) {
							dirs.push(create.pop());
							makeDir();
						} else {
							execute();
						}
					},
					function(e) {
						if(e.name === 'NotFoundError') {
							create.push(dirs.pop());
							makeDir();
						} else {
							errorHandler(e);
						}
					}
				);
			};

			makeDir();

		},
		rmdir: function(dirname, callback) {
			var errorHandler = this.__error__.bind(this, {name: 'rmdir', path: dirname});
			var execute = this.__execute__.bind(this, callback);
			var fs = this.fs;

			if(dirname==='' || dirname==='/') {
				var dirReader = fs.root.createReader();
				dirReader.readEntries(
					function(entries) {
						var count = 0;
						var len = entries.length;
						if(!len) {
							execute();
						} else {
							var increment = function() {
								count++;
								if(count===len) {
									execute();
								}
							};
							for(var i=0;i<len;i++) {
								var entry = entries[i];
								if(entry.isDirectory) {
									entry.removeRecursively(
										increment,
										errorHandler
									);
								} else {
									entry.remove(
										increment,
										errorHandler
									);
								}
							}
						}
					},
					errorHandler
				);
			} else { 
				fs.root.getDirectory(
					dirname,
					{},
					function(dirEntry) {
						dirEntry.removeRecursively(
							execute,
							errorHandler
						);
					},
					function(e) {
						if(e.name === 'NotFoundError') {
							execute();
						} else if(e.name === 'TypeMismatchError') {
							errorHandler('Not a directory entry');
						} else {
							errorHandler(e);
						}
					}
				);
			}
		},
		rename: function(path, name, callback) {

			var movePos = path.lastIndexOf('/', path.length - 2);
			var movePath = null;
			if(movePos > 0) {
				movePath = path.substr(0, movePos);
			}

			var errorHandler = this.__error__.bind(this, {name: 'rename', path: path});
			var errorHandlerTo = this.__error__.bind(this, {name: 'rename to', path: name});
			var execute = this.__execute__.bind(this, callback);
			var fs = this.fs;

			var getDirectory = function() {

				fs.root.getDirectory(
					path,
					{},
					function(dirEntry) {
						if(!movePath) {
							dirEntry.moveTo(
								fs.root,
								name,
								execute.bind(null, path, name),
								function(e) {
									if(e.name === 'InvalidModificationError') {
										errorHandlerTo('File ' + name + ' already exists');
									} else {
										errorHandlerTo(e);
									}
								}
							);
						} else {
							fs.root.getDirectory(
								movePath,
								{},
								function(dirEntryTo) {

									dirEntry.moveTo(
										dirEntryTo,
										name,
										execute.bind(null, path, name),
										function(e) {
											if(e.name === 'InvalidModificationError') {
												errorHandlerTo('File ' + name + ' already exists');
											} else {
												errorHandlerTo(e);
											}
										}
									);
								
								},
								errorHandlerTo
							);
						}
					},
					errorHandler
				);

			};

			fs.root.getFile(
				path,
				{},
				function(fileEntry) {
					if(!movePath) {
						fileEntry.moveTo(
							fs.root,
							name,
							execute.bind(null, path, name),
							function(e) {
								if(e.name === 'InvalidModificationError') {
									errorHandlerTo('File ' + name + ' already exists');
								} else {
									errorHandlerTo(e);
								}
							}
						);
					} else {
						fs.root.getDirectory(
							movePath,
							{},
							function(dirEntry) {
								fileEntry.moveTo(
									dirEntry,
									name,
									execute.bind(null, path, name),
									function(e) {
										if(e.name === 'InvalidModificationError') {
											errorHandlerTo('File ' + name + ' already exists');
										} else {
											errorHandlerTo(e);
										}
									}
								);
							},
							errorHandlerTo
						);
					}
				},
				function(e) {
					if(e.name === 'TypeMismatchError') {
						getDirectory();
					} else {
						errorHandler(e);
					}
				}
			);

		},
		move: function(path, movePath, newName, callback) {

			var errorHandler = this.__error__.bind(this, {name: 'move', path: path});
			var errorHandlerTo = this.__error__.bind(this, {name: 'move to', path: movePath});
			var execute = this.__execute__.bind(this, callback);
			var fs = this.fs;

			if(!newName) { newName = null; }

			var getDirectory = function() {
				fs.root.getDirectory(
					path,
					{},
					function(dirEntry) {
						fs.root.getDirectory(
							movePath,
							{},
							function(dirEntryTo) {
								dirEntry.moveTo(
									dirEntryTo,
									newName,
									execute.bind(null, path, name),
									function(e) {
										if(e.name === 'InvalidModificationError') {
											errorHandlerTo('File already exists');
										} else {
											errorHandlerTo(e);
										}
									}
								);
							},
							errorHandlerTo
						);
					},
					errorHandler
				);
			};

			fs.root.getFile(
				path,
				{},
				function(fileEntry) {
					fs.root.getDirectory(
						movePath,
						{},
						function(dirEntry) {
							fileEntry.moveTo(
								dirEntry,
								newName,
								execute.bind(null, path, name),
								function(e) {
									if(e.name === 'InvalidModificationError') {
										errorHandlerTo('File already exists');
									} else {
										errorHandlerTo(e);
									}
								}
							);
						},
						errorHandlerTo
					);
				},
				function(e) {
					if(e.name === 'TypeMismatchError') {
						getDirectory();
					} else {
						errorHandler(e);
					}
				}
			);

		},
		copy: function(path, movePath, newName, callback) {

			var errorHandler = this.__error__.bind(this, {name: 'copy', path: path});
			var errorHandlerTo = this.__error__.bind(this, {name: 'copy to', path: movePath});
			var execute = this.__execute__.bind(this, callback);
			var fs = this.fs;

			if(!newName) { newName = null; }

			var getDirectory = function() {
				fs.root.getDirectory(
					path,
					{},
					function(dirEntry) {
						fs.root.getDirectory(
							movePath,
							{},
							function(dirEntryTo) {
								dirEntry.copyTo(
									dirEntryTo,
									newName,
									execute.bind(null, path, movePath),
									function(e) {
										if(e.name === 'InvalidModificationError') {
											errorHandlerTo('File already exists');
										} else {
											errorHandlerTo(e);
										}
									}
								);
							},
							errorHandlerTo
						);
					},
					errorHandler
				);
			};

			fs.root.getFile(
				path,
				{},
				function(fileEntry) {
					fs.root.getDirectory(
						movePath,
						{},
						function(dirEntry) {
							fileEntry.copyTo(
								dirEntry,
								newName,
								execute.bind(null, path, movePath),
								function(e) {
									if(e.name === 'InvalidModificationError') {
										errorHandlerTo('File already exists');
									} else {
										errorHandlerTo(e);
									}
								}
							);
						},
						errorHandlerTo
					);
				},
				function(e) {
					if(e.name === 'TypeMismatchError') {
						getDirectory();
					} else {
						errorHandler(e);
					}
				}
			);

		},
		list: function(dirname, maxDepth, callback) {
			var errorHandler = this.__error__.bind(this, {name: 'list', path: dirname});
			var execute = this.__execute__.bind(this, callback);
			var fs = this.fs;

			var toURL = this.parent.toURL.bind(this.parent);

			if(maxDepth !== null) {
				maxDepth = Math.max(0, maxDepth | 0);
			}

			var busy = {};
			var baseObject = {};

			var done = function(ident) {
				delete busy[ident];
				if(!Object.keys(busy).length) {
					execute(baseObject);
				}
			};

			var readDir = function(dirEntry, arr, depth) {
				if(maxDepth !== null && depth > maxDepth) { return; }

				var ident = dirEntry.fullPath;
				busy[ident] = true;

				var filesChecked = 0;

				var dirReader = dirEntry.createReader();
				dirReader.readEntries(
					function(entries) {
						var len = entries.length;
						if(!len) { done(ident); return; }
						var fn = function(entry, obj) {
							entry.getMetadata(
								function(data) {
									obj.size = data.size;
									obj.modified = data.modificationTime;
									filesChecked++;
									if(obj.isDirectory) {
										obj.children = [];
										readDir(entry, obj.children, depth + 1);
									}
									if(filesChecked === len) {
										done(ident);
									}
								},
								errorHandler
							);
						};
						for(var i=0;i<len;i++) {
							var entry = entries[i];
							var obj = {
								name: entry.name,
								fullPath: entry.fullPath,
								url: toURL(entry.fullPath),
								isDirectory: entry.isDirectory,
								isFile: entry.isFile
							};
							fn(entry, obj);
							arr.push(obj);
						}
					},
					errorHandler
				);
			};

			if(dirname === '' || dirname==='/') {
				baseObject.name = '/';
				baseObject.fullPath = '/';
				baseObject.children = [];
				baseObject.isFile = false;
				baseObject.isDirectory = true;
				fs.root.getMetadata(
					function(data) {
						baseObject.size = data.size;
						baseObject.modified = data.modificationTime;
						readDir(fs.root, baseObject.children, 0);
					},
					errorHandler
				);
			} else {
				fs.root.getDirectory(
					dirname,
					{},
					function(dirEntry) {
						baseObject.name = dirEntry.name;
						baseObject.fullPath = dirEntry.fullPath;
						baseObject.children = [];
						baseObject.isFile = false;
						baseObject.isDirectory = true;
						dirEntry.getMetadata(
							function(data) {
								baseObject.size = data.size;
								baseObject.modified = data.modificationTime;
								readDir(dirEntry, baseObject.children, 0);
							},
							errorHandler
						);
					},
					function(e) {
						if(e.name === 'TypeMismatchError') {
							errorHandler('Not a directory entry');
						} else {
							errorHandler(e);
						}
					}
				);
			}

		}
	};

	function FSO(size, persistent, successCallback, errorCallback) {

		size = parseInt(size);
		if(isNaN(size)) {
			size = 1024 * 1024 * 1024; // 1GB
		} else {
			size = Math.ceil(Math.max(0, size));
		}

		this._queue = [];
		this.__state = fsoStates.INITIALIZING;
		this.fs = null;
		this.availableBytes = 0;
		this.persistent = !!persistent;
		this.rootURL = 'filesystem:' + window.location.origin + '/' + (this.persistent?'persistent/':'temporary/');

		this._callbacks = {
			success: null,
			error: null
		};

		if(typeof(successCallback)==='function') {
			this._callbacks.success = successCallback;
		}

		if(typeof(errorCallback)==='function') {
			this._callbacks.__error__ = errorCallback;
		}

		var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
		if(!requestFileSystem) {
			this.__error__({name: 'constructor'}, 'This browser does not support the FileSystem API');
			return;
		}

		var pConst = window.PERSISTENT || 1;
		var tConst = window.TEMPORARY || 0;

		requestFileSystem(
			this.persistent?pConst:tConst,
			size,
			this.__init__.bind(this, size, persistent),
			this.__error__.bind(this)
		);

	}

	FSO.prototype.__error__ = function(info, e) {

		var message;
		if(typeof(e)==='string') {
			message = e;
		} else {
			switch(e.name) {
				case 'NotFoundError':
					message = 'File or directory does not exist';
					break;
				default:
					message = e.message || e.name;
					break;
			}
		}

		info['object'] = this.constructor.name;
		info['message'] = message;

		this.__state = fsoStates.ERROR;

		var errorCallback = this._callbacks.__error__;
		if(typeof(errorCallback)==='function') {
			errorCallback.call(this.parent, info);
			return;
		}

		throw new Error(
			info.object + '.' +
			info.name +
			(typeof(info.path)!=='undefined'?' [' + fsoParsePath(info.path) + ']':'') +
			': ' + info.message + (this.__line?' (' + this.__line + ')':'')
		);

	};

	FSO.prototype.__requestStorage__ = function(size) {
		this.availableBytes = size;
		this.__state = fsoStates.READY;
		this.__ready__();
	};

	FSO.prototype.__init__ = function(size, persistent, fs) {
		this.fs = fs;
		this.rootURL = this.fs.root.toURL();
		if(persistent) {
			navigator.webkitPersistentStorage.requestQuota(
				size,
				this.__requestStorage__.bind(this, size),
				this.__error__.bind(this)
			);
		} else {
			navigator.webkitTemporaryStorage.requestQuota(
				size,
				this.__requestStorage__.bind(this, size),
				this.__error__.bind(this)
			);
		}
	};

	FSO.prototype.toURL = function(path) {
		if(path.indexOf('/')===0) {
			path = path.substr(1);
		}
		return this.rootURL + path;
	};

	FSO.prototype.__ready__ = function() {

		if(this.__state === fsoStates.READY) {

			if(this._callbacks.success) {
				this._callbacks.success.call(this);
			}

			if(this._queue) {

				for(var i=0,len=this._queue.length;i<len;i++) {
					var fsq = this._queue[i];
					if(fsq instanceof FSOQueue) {
						fsq.__ready__();
					}
				}

				delete this._queue;

			}

		}

	};

	FSO.prototype.createQueue = function() {
		var fsq = new FSOQueue(this);
		if(this.__state === fsoStates.INITIALIZING) {
			this._queue.push(fsq);
		} else {
			fsq.__ready__();
		}
		return fsq;
	};

	function FSOQueue(fileSystemObject) {

		if(!(fileSystemObject instanceof FSO)) {
			this.__error__({name: 'constructor'}, 'FSOQueue must be instantiated with valid FSO');
		}
		this.parent = fileSystemObject;

		this._callbacksSet = false;
		this._callbacks = {
			success: null,
			error: null
		};

		this.__line = null;

		this.__committed = false;

		if(this.parent.__state === fsoStates.INITIALIZING) {
			this.__state = fsoStates.INITIALIZING;
		} else {
			this.__state = fsoStates.READY;
			this.fs = this.parent.fs;
			this.currentDirectory = this.fs.root;
		}

		this._queue = [];

	}

	FSOQueue.prototype.__error__ = FSO.prototype.__error__;

	FSOQueue.prototype.__ready__ = function() {

		if(this.__state === fsoStates.INITIALIZING) {

			this.fs = this.parent.fs;
			this.currentDirectory = this.fs.root;
			this.__state = fsoStates.READY;

			if(this.__committed) {
				this.__state = fsoStates.EXECUTING;
				this.__execute__();
			}

		}

	};

	FSOQueue.prototype.__prepare__ = function(command, args) {

		if(typeof(fsoCommands[command])!=='function') {
			throw new Error('Invalid command: ' + command);
		}

		var line = (new Error).stack.split('\n')[3];
		line = line.slice(line.indexOf('at ') + 3, line.length);

		if(this.__committed === true) {
			this.__line = line;
			this.__error__({name: command}, 'Queue is already executing or awaiting execution');
		}

		this._queue.push([command, args, line]);

	};

	FSOQueue.prototype.__execute__ = function(func) {

		if(this.__state === fsoStates.EXECUTING) {

			if(typeof(func)==='function') {
				func.apply(this.parent, [].slice.call(arguments, 1));
			}

			if(this._queue.length) {
				var currentCommand = this._queue.shift();
				this.__line = currentCommand[2];
				fsoCommands[currentCommand[0]].apply(this, currentCommand[1]);
			} else {
				var successCallback = this._callbacks.success;
				if(typeof(successCallback)==='function') {
					successCallback.call(this.parent);
				}
				this.__state = fsoStates.COMPLETE;
			}

		}

	};

	FSOQueue.prototype.execute = function(success, error) {
		if(this.__committed === true) {
			var line = (new Error).stack.split('\n')[2];
			line = line.slice(line.indexOf('at ') + 3, line.length);
			this.__line = line;
			this.__error__({name: 'execute'}, 'Queue is already executing or awaiting execution');
		}
		this.__committed = true;

		if(!this._callbacksSet) {
			if(typeof(success) === 'function') {
				this._callbacks.success = success;
			}
			if(typeof(error) === 'function') {
				this._callbacks.__error__ = error;
			}
			this._callbacksSet = true;
		}
		if(this.__state === fsoStates.READY) {
			this.__state = fsoStates.EXECUTING;
			this.__execute__();
		}

	};

	var keys = Object.keys(fsoCommands);
	var preparePrototype = function(key){
		FSOQueue.prototype[key] = function() {
			this.__prepare__(key, [].slice.call(arguments));
			return this;
		};
	};
	for(var i=0,len=keys.length;i<len;i++) {
		preparePrototype(keys[i]);
	}

	window['FSO'] = FSO;
	window['FSOUtil'] = FileSystemUtil;

})();