/**
 * Encapsulates the concept of a folder in a filesystem.
 */
var Folder = function(args) {
	this.parent = args.parent;
	this.name = args.name;

	// set this folder's full path based on the parent.  If the folder being requested is root,
	// the path must be specified in the call to the constructor.
	if(args.path != "/") {
		this.fullPath = (this.parent.fullPath == '/' ? '' : this.parent.fullPath) + "/" + this.name;
		console.log("Setting full path of " + this.name + " to " + this.fullPath);
	} else {
		this.fullPath = "/";
	}

	// if child directories aren't specified, make empty folder
	if(args.children != null) {
		this.children = args.children;
	} else {
		this.children = [];
	}

	/**
	 * Adds a folder to this directory
	 */
	this.addFolder = function(folder) {
		folder.parent = this;
		this.children.push(folder);
	};

	/**
	 * Gets a child from this folder's children if it exists--returns
	 * false otherwise.
	 */
	this.getChildByName = function(name) {
		for(f in this.children) {
			if(this.children[f].name == name) {
				return this.children[f];	// synonymous with true
			}
		}
		return false;	// child does not exist
	};
};

/**
 * Creates the basis of a linux filesystem and supplies methods for manipulating it.
 */
var FolderStructure = function() {
	// create the root directory--you're not 1337 enough to go above root
	this.root = new Folder({ parent: null, name: '', path: "/" });

	var home = new Folder({ parent: this.root, name: "home" });
	var user = new Folder({ parent: home, name: "user" });
	user.addFolder( new Folder({ parent: user, name: ".config" }) );
	user.addFolder( new Folder({ parent: user, name: ".local" }) );
	user.addFolder( new Folder({ parent: user, name: "Documents" }) );
	user.addFolder( new Folder({ parent: user, name: "Pictures" }) );
	user.addFolder( new Folder({ parent: user, name: "Videos" }) );
	home.addFolder( user );

	this.root.addFolder( new Folder({ parent: this.root, name: "bin" }) );
	this.root.addFolder( new Folder({ parent: this.root, name: "sbin" }) );
	this.root.addFolder( new Folder({ parent: this.root, name: "etc" }) );
	this.root.addFolder( new Folder({ parent: this.root, name: "dev" }) );
	this.root.addFolder( new Folder({ parent: this.root, name: "proc" }) );
	this.root.addFolder( new Folder({ parent: this.root, name: "var" }) );
	this.root.addFolder( new Folder({ parent: this.root, name: "tmp" }) );
	this.root.addFolder( new Folder({ parent: this.root, name: "usr" }) );
	this.root.addFolder( home );
	this.root.addFolder( new Folder({ parent: this.root, name: "boot" }) );
	this.root.addFolder( new Folder({ parent: this.root, name: "lib" }) );
	this.root.addFolder( new Folder({ parent: this.root, name: "opt" }) );
	this.root.addFolder( new Folder({ parent: this.root, name: "mnt" }) );
	this.root.addFolder( new Folder({ parent: this.root, name: "media" }) );
	this.root.addFolder( new Folder({ parent: this.root, name: "srv" }) ) ;

	/**
	 * Locates a directory in the filesystem tree by the path parameter if it
	 * exists--returns false otherwise.
	 */
	this.findDirectory = function(dirString) {
		var nodes = dirString.split("/");
		nodes = nodes.slice(1, nodes.length);	// remove root node from dirString
		var filePointer = this.root;

		if(nodes != this.root.name) {
			for(n in nodes) {
				console.log("Attempting to find " + nodes[n]);
				filePointer = filePointer.getChildByName(nodes[n]);
			}
		} else {
			console.log("Attempting to find root");
			filePointer = this.root;
		}
		return filePointer;
	};
};

/**
 * Facilitates the mapping of a name to an executable function.
 */
var Command = function(name, operation) {
	this.name = name;
	this.operation = operation;

	/**
	 * Executes the callback this command was instantiated with.
	 */
	this.exec = function(context, args) {
		this.operation(context, args);
	}
};

/**
 * Stores a list of available commands with supporting methods to invoke
 * commands by name.
 */
var CommandSet = function(context) {
	this.context = context;
	this.commands = [];

	/**
	 * Adds a command to this command set.
	 */
	this.addCommand = function(command) {
		this.commands.push(command);
	};

	/**
	 * Executes a command with certain arguments given the name and
	 * arguments for that command.  Assumes there is only one command with
	 * a given name in the list. Returns whether or not the command was found.
	 */
	this.execCommandByName = function(name, args) {
		var found = false;
		for(c in this.commands) {
			if(name == this.commands[c].name) {
				found = true;
				this.commands[c].exec(this.context, args);
			}
		}
		return found;
	};
}

/**
 * Stores the context of the terminal, and initializes the faux filesystem state.
 */
var TerminalContext = function(term, filesystem) {
	this.cwd = "/";
	this.terminal = term;
	this.filesystem = filesystem;
	this.commandSet = new CommandSet(this);

	this.commandSet.addCommand(new Command('ls', ls));
	this.commandSet.addCommand(new Command('cd', cd));
	this.commandSet.addCommand(new Command('mkdir', mkdir));

	/**
	 * Updates the terminal prompt based on the current working directory.
	 */
	this.updatePrompt = function() {
		var nodes = this.cwd.split("/");
		console.log(this.cwd);
		var prompt = nodes.slice(nodes.length - 1, nodes.length);
		this.terminal.set_prompt("[user@shellcommander " + (prompt[0] ? "" : "/")
			+ (prompt[0] ? prompt[0] : "")
			+ (prompt[1] ? prompt[1] : "") + "]$ ");
	};
};

/**
 * Function to emulate a simple version of the linux list directory command.
 */
var ls = function(context) {
	var rowLength = 11;
	var rowString = "";
	var counter = 0;

	// get the children of the current working directory
	var children = context.filesystem.findDirectory(context.cwd).children;

	for(x in children) {
		rowString += (children[x].name + " ");

		/**
		 * if 0 print nothing
		 * if 1 print single rowString
		 * if > print as many lines as necessary
		 */
		if((counter != 0 || children.length == 1) && (counter % rowLength == 0 
					|| counter == children.length - 1) ) {
			context.terminal.echo(rowString);
			rowString = "";
		}
		counter++;
	}
};

/**
 * Function to emulate a simple version of the linux change directory command.
 */
var cd = function(context, args) {
	var newDir;
	if(args.trim().slice(0, 1) == "/") {	// if the directory is referenced by full path
		console.log("finding " + args + " via full path");
		newDir = context.filesystem.findDirectory(args);
	} else if(args.trim() == "..") {
		newDir = context.filesystem.findDirectory(context.cwd).parent;
	} else if(args.trim().slice(0,3) == "../") {

	} else {	// if the directory is referenced based on cwd
		console.log("finding in current directory");
		newDir = context.filesystem.findDirectory(context.cwd).getChildByName(args);
	}

	// if the new directory exists, update the current working directory
	if(newDir) {
		context.cwd = newDir.fullPath;
	} else {
		context.terminal.echo("Directory \"" + args + "\" does not exist." );
	}
};

/**
 * Function to emulate a simple version of the linux make directory command.
 */
var mkdir = function(context, args) {
	var currDir = context.filesystem.findDirectory(context.cwd);
	var argParts = args.split(" ");

	for(x in argParts) {
		currDir.addFolder( new Folder({ parent: currDir, name: argParts[x] }) );
	}
};

/**
 * Initialize the terminal
 */
var CONTEXT;

$(document).ready(function() {
	// create the terminal in the contentWrapper div
	$('#contentWrapper').terminal(function(command, term) {
		if(CONTEXT == null) {
			CONTEXT = new TerminalContext(term, new FolderStructure());
		}

		if(command) {
			var commandSegments = command.split(" ");

			// if the command is found, execute and update the prompt.
			// if the command is not found, say so
			if(CONTEXT.commandSet.execCommandByName(commandSegments[0], 
					commandSegments.slice(1, commandSegments.length).toString())) {
				CONTEXT.updatePrompt();
			} else {
				term.echo("Command not implemented!");
			}
		}
	}
	, {
		prompt: "[user@shellcommander /]$ ", greeting: false 
	});
});
