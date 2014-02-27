FSO.js
======

FSO.js is a JavaScript FileSystemObject library for temporary and permanent client-side file storage.

This ReadMe serves as the official documentation for FSO.js.

For more in-depth information about the project, visit [FSOjs.com](http://fsojs.com).

Detailed example code is available at [FSOjs - Examples](http://fsojs.com/examples.html).

Tweet the creator (me!) at [@keithwhor](http://twitter.com/keithwhor)

Getting Started
---------------

FSO can be included on any webpage using:

```html
<script src="your_script_path/fso.min.js"></script>
```

And a typical use case might be:

```js
var fso = new FSO(1024 * 1024 * 1024, false); // Create 1GB of temp storage

var fsq = fso.createQueue();

// Queues process commands sequentially,
// prepare your queue like so:
fsq.mkdir('hello');
fsq.write('hello/world.txt', 'Hello World');
fsq.read('hello/world.txt', function(data) { console.log(data); });

// Finally, execute asynchronously.
fsq.execute();
```


FSO
---

**FSO**

```
FSO(
	opt_int_byteSize, [ = 1024 * 1024 * 1024 (1GB) ]
	opt_bool_persisent, [ = false ]
	opt_fn_successCallback,
	opt_fn_errorCallback
)
```

The main FSO.js constructor

returns **FSO instance**

Instantiate using ```var fso = new FSO();```

---

**FSO.createQueue**

```
createQueue()
[ returns new FSOQueue ]
```

returns **new FSOQueue instance**

---


**FSO.toURL**

```
toURL(
	str_fullPath
)
[ returns str_resourceURL ]
```

returns a resource URL for specified ```fullPath```

---

FSOQueue
--------

**FSOQueue.write**

```
write(
	string_fullFilePath,
	string_data OR arrayBuffer_data OR array_data,
	opt_fn_successCallback
)
[ returns FSOQueue ]
```

Writes a file to an existing directory.

Creates files if they do not exist.

Truncates and overwrites existing files.

---

**FSOQueue.append**

```
append(
	string_fullFilePath,
	string_data OR arrayBuffer_data OR array_data,
	opt_fn_successCallback
)
[ returns FSOQueue ]
```

Appends data to an existing file.

Creates files if they do not exist.

---

**FSOQueue.insert**

```
insert(
	string_fullFilePath,
	string_data OR arrayBuffer_data OR array_data,
	int_byteOffset,
	opt_fn_successCallback
)
[ returns FSOQueue ]
```

Inserts data to existing file at ```byteOffset```.

Overwrites file data at ```byteOffset``` to data length.

Zeroes out all data between current file length and ```byteOffset```.

Creates files if they do not exist.

---

**FSOQueue.put**

```
put(
	file_File,
	string_fullPath,
	opt_string_name,
	opt_fn_successCallback
)
[ returns FSOQueue ]
```

Places a ```File``` Object (i.e. result of file selection) at ```fullPath```.

Will use given name if name not provided, or given a falsey value (i.e. empty string or ```null```).

Overwrites existing files with the same name.

---

**FSOQueue.mkdir**

```
mkdir(
	string_fullPath,
	opt_fn_successCallback
)
[ returns FSOQueue ]
```

Recursively creates all directories in ```fullPath``` if they do not exist

---

**FSOQueue.rm**

```
rm(
	string_fullPath,
	opt_fn_successCallback
)
[ returns FSOQueue ]
```

Removes an existing file or empty directory at ```fullPath```.

---

**FSOQueue.rmdir**

```
rmdir(
	string_fullPath,
	opt_fn_successCallback
)
[ returns FSOQueue ]
```

Recursively removes a directory (including contents) at ```fullPath```.

---

**FSOQueue.rename**

```
rename(
	string_fullPath,
	string_name,
	opt_fn_successCallback
)
[ returns FSOQueue ]
```

Renames file or directory at ```fullPath``` to ```name```.

---

**FSOQueue.move**

```
move(
	string_fullPath,
	string_toPath,
	opt_string_name,
	opt_fn_successCallback
)
[ returns FSOQueue ]
```

Moves file or directory at ```fullPath``` to ```toPath``` with optional name ```name```.

```name``` will remain unchanged if provided with a falsey value.

---

**FSOQueue.copy**

```
copy(
	string_fullPath,
	string_toPath,
	opt_string_name,
	opt_fn_successCallback
)
[ returns FSOQueue ]
```

Copies file or directory at ```fullPath``` to ```toPath``` with optional name ```name```.

```name``` will remain unchanged if provided with a falsey value.

---

**FSOQueue.read**

```
read(
	string_fullPath,
	fn_successCallback [ arguments str_data ]
)
[ returns FSOQueue ]
```

Reads file at ```fullPath``` and returns ```data``` to first argument of ```successCallback```.

---

**FSOQueue.readBuffer**

```
readBuffer(
	string_fullPath,
	fn_successCallback [ arguments arrayBuffer_data ]
)
[ returns FSOQueue ]
```

Reads file at ```fullPath``` and returns ```data``` to first argument of ```successCallback```.

---

**FSOQueue.info**

```
info(
	string_fullPath,
	fn_successCallback [ arguments obj_fileData ]
)
[ returns FSOQueue ]
```

Reads file metadata at ```fullPath``` and returns ```fileData``` to first argument of ```successCallback```.

---

**FSOQueue.list**

```
list(
	string_fullPath,
	int_depth,
	fn_successCallback [ arguments obj_nestedList ]
)
[ returns FSOQueue ]
```

Reads directory contents of ```fullPath``` recursively to ```depth``` directories deep, and returns ```nestedList``` to first argument of ```successCallback```.

If ```depth === null```, will return full listing.

Use ```FSOUtil.prettyDirectory``` for quick ```nestedList``` prettification.

---

**FSOQueue.getBytes**

```
getBytes(
	fn_successCallback [ arguments int_usedBytes, int_availableBytes ]
)
[ returns FSOQueue ]
```

Returns ```usedBytes, availableBytes``` to first two arguments of ```successCallback```, respectively.

```availableBytes``` represents the *total available space*, including ```usedBytes``` - not the remaining space.

---

**FSOQueue.execute**

```
execute(
	opt_fn_successCallback,
	opt_fn_errorCallback [ arguments obj_error ]
)
[ returns FSOQueue ]
```

Executes a queue, prevents new commands from being queued, and runs ```successCallback``` on queue completion.

```errorCallback``` will override default error reporting and run on failure of any command in the queue.

---

FSOUtil
-------

A static object containing useful utilities

---

**FSOUtil.prettyDirectory**

```
prettyDirectory(
	object_nestedList
)
[ returns str_prettyList ]
```

Returns a prettified (text) directory listing of ```nestedList```

---

**FSOUtil.prettySize**

```
prettySize(
	int_bytes
)
[ returns str_prettySize ]
```

Returns a prettified (text) size of ```bytes```

---




