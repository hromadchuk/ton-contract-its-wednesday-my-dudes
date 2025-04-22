import "@stdlib/deploy";

const PHRASE: String = "ITSWEDNESDAYMYDUDES";

contract ItsWednesdayMyDudes with Deployable {
    progress: Int as uint5 = 0;
    participants: map<Address, Bool> = emptyMap();
    lastCompletionWeek: Int as uint14 = 0;

    receive(str: String) {
        let weekday = ((now() / 86400) + 4) % 7;
        if (weekday != 3) {
            self.sendError("Not Wednesday");
            return;
        }

        let curWeek = ((now() / 86400) + 4) / 7;
        if (self.lastCompletionWeek == curWeek) {
            self.sendError("Already completed this Wednesday");
            return;
        }

        let letters = str.asSlice();
        if (letters.bits() != 8) {
            self.sendError("Exactly one letter required");
            return;
        }

        let letter = letters.loadUint(8);
        if (letter >= 97 && letter <= 122) {
            letter -= 32;
        }
        if (letter < 65 || letter > 90) {
            self.sendError("Only A‑Z letters accepted");
            return;
        }

        if (self.participants.exists(sender())) {
            self.reset();
            commit();
            if (!self.tryStartNewGame(letter, sender())) {
                self.sendError("Already participated")
            }
            return;
        }

        let expected = self.letterAt(self.progress);
        if (letter == expected) {
            self.participants.set(sender(), true);
            self.progress += 1;

            if (self.progress == 19) {
                self.lastCompletionWeek = curWeek;
                self.reset();
            }

            cashback(sender());
            return;
        }

        self.reset();
        commit();

        if (!self.tryStartNewGame(letter, sender())) {
            self.sendError("Wrong letter — sequence reset");
        }
    }

    fun tryStartNewGame(letter: Int, address: Address): Bool {
        if (letter == PHRASE.asSlice().loadUint(8)) {
            self.progress = 1;
            self.participants = emptyMap();
            self.participants.set(address, true);

            cashback(address);

            return true;
        }

        return false;
    }

    fun reset() {
        self.progress = 0;
        self.participants = emptyMap();
    }

    fun letterAt(i: Int): Int {
        let word: Slice = PHRASE.asSlice();
        let offset: Int = i;
        while (offset > 0) {
            word.loadUint(8);
            offset -= 1;
        }
        return word.loadUint(8);
    }

    fun sendError(reason: String) {
        let body: Cell = reason.asComment();

        send(SendParameters{
            to: sender(),
            value: 0,
            bounce: true,
            mode: SendRemainingValue + 64,
            body: body
        });
    }

    get fun getProgress(): Int {
        return self.progress;
    }

    get fun getLastCompletionWeek(): Int {
        return self.lastCompletionWeek;
    }

    get fun getParticipants(): map<Address, Bool> {
        return self.participants;
    }
}
