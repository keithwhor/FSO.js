FSO.js README
=============

This ReadMe serves as the official documentation for FSO.js.

For more information about the project, visit [FSOjs.com](http://fsojs.com) or tweet [@keithwhor](http://twitter.com/keithwhor)

FSO
---

**FSO**

```
FSO(
	opt_int_byteSize, [= 1024 * 1024 * 1024 (1GB)]
	opt_bool_persisent, [= false]
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
	fn_successCallback [returns str_data]
)
[ returns FSOQueue ]
```

Reads file at ```fullPath``` and returns ```data``` to first argument of ```successCallback```.

---

**FSOQueue.readBuffer**

```
readBuffer(
	string_fullPath,
	fn_successCallback [returns arrayBuffer_data]
)
[ returns FSOQueue ]
```

Reads file at ```fullPath``` and returns ```data``` to first argument of ```successCallback```.

---

**FSOQueue.info**

```
info(
	string_fullPath,
	fn_successCallback [returns obj_fileData]
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
	fn_successCallback [returns obj_nestedList]
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
	fn_successCallback [returns int_usedBytes, int_availableBytes]
)
[ returns FSOQueue ]
```

Returns ```usedBytes, availableBytes``` to first two arguments of ```successCallback```, respectively.

```availableBytes``` represents the *total available space*, including ```usedBytes``` - not the remaining space.

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




