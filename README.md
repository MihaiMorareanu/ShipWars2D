#*Ships Wars 2D*
	
##Descriere
	ShipWars2D este un joc in care 2 jucatori au 2 flote navale. Fiecare jucator are dreptul sa lanseze o racheta atunci cand ii vine randul. 
	Distractia se termina cand unul din jucatori doboara totae navele adversarului.

##Functionalitati
	* Jocul impreuna cu prietenii pe baza de invitatii
	* Fiecare jucator are puncte proprii
	* Daca un jucator se delogheaza in faza de configurare a tablei de joc, celalt jucator castiga jocul si este premiat cu 50 de pct.
	* Dupa ce un jucator termina de configurat pozitiile barcilor si apasa pe butonul de "StartJoc" atunci celuilalt juctor ii se mai acorda 60 de secunde pentru configurare. Daca trec cele 60 de secunde atunci jucatorul care a terminat primul de configurat primeste 50 de puncte si este castigator.
	* Ambii jucatori au dreptul sa astepte cat vor pana sa lanseze o racheta catre adversar
	* Dupa ce toate barcile au fost lovite de catre un jucator, ii se acorda 500 de puncte urmand ca pentru fiecare ratare sa se scada 5 puncte.

##Instalare
	Se executa comenzile: 

	1. git clone https://github.com/MihaiMorareanu/ShipWars2D.git
	2. cd ShipWars2D
	3. npm install -g nodemon
	4. npm install
	5. nodemon app.js 