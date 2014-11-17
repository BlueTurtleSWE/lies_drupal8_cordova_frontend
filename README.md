Lies!
=====

==What is this?
It's a micro blog where the only thing you do is posting lies anonymously. It
sounds like a terrible idea really, but if it's done with finesse and wit, and
if it doesn't involve prejudice, it could be a lot of fun!

===Would I lie to you?
Yes. Yes, I probably would. As the father of three, I have quickly abandoned 
all principles I held dear as a child. Never lying to my own children came
rather quickly.

===So what is it really?
Lies! is a Cordova and REST based frontend for Drupal 8. It is intended as a 
show case for my talent, as well as D8's REST features. With luck, it can 
inspire somebody else to write another frontend sometime.

==What do I need to do to run it?
You need to install Cordova/Phonegap and configure it for your favourite
platform. Then you need to install the plugins listed in PLUGINS.md
Lastly, you'll need to download the jquery files referenced in index.html
Oh, you may have to re-roll the jQuery Mobile theme to get all the icons and
stuff.

===Why didn't you include it all in the repo?
Seems like a bad idea to clutter up the git diffs with a lot of compiled 
files when we want to upgrade them. So all that'll change is the link in 
index.html.

===How do I run it?
On Linux or Mac, I would suggest that you run "mkdir temp" in the project root.
After that, you'll probably want to run "cordova platforms add browser", and
lastly you could run "./build-browser". After that, you can do your dry-runs
on temp/index.html in a browser window. When everything works nicely, you can
run it on an Android phone with the command "./build-android" (if the phone is
connected, and you installed the android platform).

For iOS, all you have to do is type "cordova run ios" in the root of the
project (assuming you have purchased a dev license from Apple, and configured
XCode, and probably already built a HelloWorld project already).

==Anything else?
Yes. This project is GPLv2. You can download it, change it, run it on your
phone etc. You can build commercial projects too. But if you distribute them,
you are gonna have to tell everybody that it is a GPLv2 project, and that 
anybody who asks has a right to the source code of the project.

Additionally, the distribution agreement on AppStore is not compatible with
GPLv2. This means that you will need my explicit agreement, if you want to
distribute it there. If you ask, I will grant such a permission.

More on the license in the file LICENSE

/Filip
