@echo off
rem http://homemedia.sbs/quicksearch.xpi
mkdir target
cd src
jar -cf ..\target\checksum-verifier.xpi *.*
cd ..

copy target\checksum-verifier.xpi \\Alpha\Tomcat\andromeda2.sbs\ROOT\ 

rmdir /s /q target

echo Done.
