const EternalStorageGobernanza = artifacts.require("EternalStorageGobernanza");
const MockGovernor = artifacts.require("MockGovernor");
const { expectRevert } = require("@openzeppelin/test-helpers")

contract("EternalStorageGobernanza", async (accounts) => {

	const GOVERNOR = accounts[8];
	const NOT_A_GOVERNOR = accounts[7];
	// For testing all except the set functions
	const keys1 = {
		uInt: "0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf74711",
		string: "0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf74712",
		address: "0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf74713",
		bytes: "0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf74714",
		bool: "0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf74715",
		int: "0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf74716"
	};
	const values1 = {
		uInt: 1111,
		string: "string",
		address: accounts[0],
		bytes: "0x00aaff",
		bool: true,
		int: 13
	};
	// Exclusive for testing set functions
	const keys2 = {
		uInt: "0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf74721",
		string: "0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf74722",
		address: "0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf74723",
		bytes: "0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf74724",
		bool: "0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf74725",
		int: "0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf74726"
	};
	const values2 = {
		uInt: 2222,
		string: "string",
		address: accounts[1],
		bytes: "0x11bbcc",
		bool: false,
		int: 32
	};

	const defaultValues = {
		uInt: 0,
		string: "",
		address: "0x0000000000000000000000000000000000000000",
		bytes: null,
		bool: false,
		int: 0
	};

	before(async () => {
		this.governor = await MockGovernor.new(GOVERNOR);
		const governorContract = this.governor.address;
		this.eternalStorageGobernanza = await EternalStorageGobernanza.new();
		await this.eternalStorageGobernanza.initialize(governorContract);
		// Setting values to test get and delete functions
		await this.eternalStorageGobernanza.setUint(keys1.uInt, values1.uInt, { from: GOVERNOR });
		await this.eternalStorageGobernanza.setString(keys1.string, values1.string, { from: GOVERNOR });
		await this.eternalStorageGobernanza.setAddress(keys1.address, values1.address, { from: GOVERNOR });
		await this.eternalStorageGobernanza.setBytes(keys1.bytes, values1.bytes, { from: GOVERNOR });
		await this.eternalStorageGobernanza.setBool(keys1.bool, values1.bool, { from: GOVERNOR });
		await this.eternalStorageGobernanza.setInt(keys1.int, values1.int, { from: GOVERNOR });
	});

	// Testing get functions
	it("Should get uint passing its key", async () => {
		const uIntReturned = await this.eternalStorageGobernanza.getUint(keys1.uInt);
		assert.equal(uIntReturned, values1.uInt);
	});
	it("Should get string passing its key", async () => {
		const stringReturned = await this.eternalStorageGobernanza.getString(keys1.string);
		assert.equal(stringReturned, values1.string);
	});
	it("Should get address passing its key", async () => {
		const addressReturned = await this.eternalStorageGobernanza.getAddress(keys1.address);
		assert.equal(addressReturned, values1.address);
	});
	it("Should get bytes passing its key", async () => {
		const bytesReturned = await this.eternalStorageGobernanza.getBytes(keys1.bytes);
		assert.equal(bytesReturned, values1.bytes);
	});
	it("Should get bool passing its key", async () => {
		const boolReturned = await this.eternalStorageGobernanza.getBool(keys1.bool);
		assert.equal(boolReturned, values1.bool);
	});
	it("Should get int passing its key", async () => {
		const intReturned = await this.eternalStorageGobernanza.getInt(keys1.int);
		assert.equal(intReturned, values1.int);
	});

	// Testing set functions with authorized changer
	it("Should set uint passing its key and with authorized changer", async () => {
		await this.eternalStorageGobernanza.setUint(keys2.uInt, values2.uInt, { from: GOVERNOR });
		const uIntReturned = await this.eternalStorageGobernanza.getUint(keys2.uInt);
		assert.equal(uIntReturned, values2.uInt);
	});
	it("Should set string passing its key and with authorized changer", async () => {
		await this.eternalStorageGobernanza.setString(keys2.string, values2.string, { from: GOVERNOR });
		const stringReturned = await this.eternalStorageGobernanza.getString(keys2.string);
		assert.equal(stringReturned, values2.string);
	});
	it("Should set address passing its key and with authorized changer", async () => {
		await this.eternalStorageGobernanza.setAddress(keys2.address, values2.address, { from: GOVERNOR });
		const addressReturned = await this.eternalStorageGobernanza.getAddress(keys2.address);
		assert.equal(addressReturned, values2.address);
	});
	it("Should set bytes passing its key and with authorized changer", async () => {
		await this.eternalStorageGobernanza.setBytes(keys2.bytes, values2.bytes, { from: GOVERNOR });
		const bytesReturned = await this.eternalStorageGobernanza.getBytes(keys2.bytes);
		assert.equal(bytesReturned, values2.bytes);
	});
	it("Should set bool passing its key and with authorized changer", async () => {
		await this.eternalStorageGobernanza.setBool(keys2.bool, values2.bool, { from: GOVERNOR });
		const boolReturned = await this.eternalStorageGobernanza.getBool(keys2.bool);
		assert.equal(boolReturned, values2.bool);
	});
	it("Should set int passing its key and with authorized changer", async () => {
		await this.eternalStorageGobernanza.setInt(keys2.int, values2.int, { from: GOVERNOR });
		const intReturned = await this.eternalStorageGobernanza.getInt(keys2.int);
		assert.equal(intReturned, values2.int);
	});

	// Testing set functions with unauthorized changer
	it("Should not set uint passing its key and with unauthorized changer", async () => {
		await expectRevert(
			this.eternalStorageGobernanza.setUint(keys2.uInt, values2.uInt, { from: NOT_A_GOVERNOR }),
			"Invalid changer -- Reason given: Invalid changer."
		);
	});
	it("Should not set string passing its key and with unauthorized changer", async () => {
		await expectRevert(
			this.eternalStorageGobernanza.setString(keys2.string, values2.string, { from: NOT_A_GOVERNOR }),
			"Invalid changer -- Reason given: Invalid changer."
		);
	});
	it("Should not set address passing its key and with unauthorized changer", async () => {
		await expectRevert(
			this.eternalStorageGobernanza.setAddress(keys2.address, values2.address, { from: NOT_A_GOVERNOR }),
			"Invalid changer -- Reason given: Invalid changer."
		);
	});
	it("Should not set bytes passing its key and with unauthorized changer", async () => {
		await expectRevert(
			this.eternalStorageGobernanza.setBytes(keys2.bytes, values2.bytes, { from: NOT_A_GOVERNOR }),
			"Invalid changer -- Reason given: Invalid changer."
		);
	});
	it("Should not set bool passing its key and with unauthorized changer", async () => {
		await expectRevert(
			this.eternalStorageGobernanza.setBool(keys2.bool, values2.bool, { from: NOT_A_GOVERNOR }),
			"Invalid changer -- Reason given: Invalid changer."
		);
	});
	it("Should not set int passing its key and with unauthorized changer", async () => {
		await expectRevert(
			this.eternalStorageGobernanza.setInt(keys2.int, values2.int, { from: NOT_A_GOVERNOR }),
			"Invalid changer -- Reason given: Invalid changer."
		);
	});

	// Testing delete functions with authorized changer
	it("Should delete uint passing its key and with authorized changer", async () => {
		await this.eternalStorageGobernanza.deleteUint(keys2.uInt, { from: GOVERNOR });
		const uIntReturned = await this.eternalStorageGobernanza.getUint(keys2.uInt);
		assert.equal(uIntReturned, defaultValues.uInt);
	});
	it("Should delete string passing its key and with authorized changer", async () => {
		await this.eternalStorageGobernanza.deleteString(keys2.string, { from: GOVERNOR });
		const stringReturned = await this.eternalStorageGobernanza.getString(keys2.string);
		assert.equal(stringReturned, defaultValues.string);
	});
	it("Should delete address passing its key and with authorized changer", async () => {
		await this.eternalStorageGobernanza.deleteAddress(keys2.address, { from: GOVERNOR });
		const addressReturned = await this.eternalStorageGobernanza.getAddress(keys2.address);
		assert.equal(addressReturned, defaultValues.address);
	});
	it("Should delete bytes passing its key and with authorized changer", async () => {
		await this.eternalStorageGobernanza.deleteBytes(keys2.bytes, { from: GOVERNOR });
		const bytesReturned = await this.eternalStorageGobernanza.getBytes(keys2.bytes);
		assert.equal(bytesReturned, defaultValues.bytes);
	});
	it("Should delete bool passing its key and with authorized changer", async () => {
		await this.eternalStorageGobernanza.deleteBool(keys2.bool, { from: GOVERNOR });
		const boolReturned = await this.eternalStorageGobernanza.getBool(keys2.bool);
		assert.equal(boolReturned, defaultValues.bool);
	});
	it("Should delete int passing its key and with authorized changer", async () => {
		await this.eternalStorageGobernanza.deleteInt(keys2.int, { from: GOVERNOR });
		const intReturned = await this.eternalStorageGobernanza.getInt(keys2.int);
		assert.equal(intReturned, defaultValues.int);
	});

	// Testing delete functions with unauthorized changer
	it("Should not delete uint passing its key and with unauthorized changer", async () => {
		await expectRevert(
			this.eternalStorageGobernanza.deleteUint(keys1.uInt,	 { from: NOT_A_GOVERNOR }),
			"Invalid changer -- Reason given: Invalid changer."
		);
	});
	it("Should not delete string passing its key and with unauthorized changer", async () => {
		await expectRevert(
			this.eternalStorageGobernanza.deleteString(keys1.string, { from: NOT_A_GOVERNOR }),
			"Invalid changer -- Reason given: Invalid changer."
		);
	});
	it("Should not delete address passing its key and with unauthorized changer", async () => {
		await expectRevert(
			this.eternalStorageGobernanza.deleteAddress(keys1.address, { from: NOT_A_GOVERNOR }),
			"Invalid changer -- Reason given: Invalid changer."
		);
	});
	it("Should not delete bytes passing its key and with unauthorized changer", async () => {
		await expectRevert(
			this.eternalStorageGobernanza.deleteBytes(keys1.bytes, { from: NOT_A_GOVERNOR }),
			"Invalid changer -- Reason given: Invalid changer."
		);
	});
	it("Should not delete bool passing its key and with unauthorized changer", async () => {
		await expectRevert(
			this.eternalStorageGobernanza.deleteBool(keys1.bool, { from: NOT_A_GOVERNOR }),
			"Invalid changer -- Reason given: Invalid changer."
		);
	});
	it("Should not delete int passing its key and with unauthorized changer", async () => {
		await expectRevert(
			this.eternalStorageGobernanza.deleteInt(keys1.int, { from: NOT_A_GOVERNOR }),
			"Invalid changer -- Reason given: Invalid changer."
		);
	});
});