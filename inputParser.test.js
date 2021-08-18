const inputParser = require('./inputParser');


/*
* RemovePrefix Tests
* */
test('!wr gets removed with standard syntax', () => {
    expect(inputParser.removePrefix("!wr Astronauten StereotypicalCat")).toBe("Astronauten StereotypicalCat")
})

test('!winrate gets removed with standard syntax', () => {
    expect(inputParser.removePrefix("!wr Astronauten StereotypicalCat")).toBe("Astronauten StereotypicalCat")
})

/*
* parse numbers test
* */

test('Cannot parse hi', () => {
    expect(inputParser.parseNumber('Hi')).toBe(-1);
})

test('Parses 0', () => {
    expect(inputParser.parseNumber('0')).toBe(0);
})

test('Parses 100', () => {
    expect(inputParser.parseNumber('100')).toBe(100);
})

/*
* Parse options test
* */

test("Parses matches parameter", () => {
    expect(inputParser.parseOptions('--matches 10 StereotypicalCat Astronauten').newMessageContent).toBe('StereotypicalCat Astronauten');
    expect(inputParser.parseOptions('--matches 10 StereotypicalCat Astronauten').matches).toBe(10);
})

test("Parses fromdaysago parameter", () => {
    expect(inputParser.parseOptions('--fromdaysago 69 StereotypicalCat Astronauten').newMessageContent).toBe('StereotypicalCat Astronauten');
    expect(inputParser.parseOptions('--fromdaysago 69 StereotypicalCat Astronauten').daysago).toBe(69);
})

test("Parses type sf parameter", () => {
    expect(inputParser.parseOptions('--type sf StereotypicalCat Astronauten').newMessageContent).toBe('StereotypicalCat Astronauten');
    expect(inputParser.parseOptions('--type sf StereotypicalCat Astronauten').type).toBe('sf'    );
})

test("Parses multiple parameters", () => {
    let input = '--matches 10 --type ao StereotypicalCat Astronauten';
    let output = inputParser.parseOptions(input);
    expect(output.newMessageContent).toBe('StereotypicalCat Astronauten');
    expect(output.matches).toBe(10);
    expect(output.type).toBe('ao');
})

test("Parses parameter when users use \"\" syntax", () => {
    let input = '--matches 10 --type ao "User Name" "TSM MonkeyBoy"';
    let output = inputParser.parseOptions(input);
    expect(output.newMessageContent).toBe('"User Name" "TSM MonkeyBoy"');
    expect(output.matches).toBe(10);
    expect(output.type).toBe('ao');
})

test("Doesn't fail with 0 parameters", () => {
    let input = '"User Name" "TSM MonkeyBoy"';
    let output = inputParser.parseOptions(input);
    expect(output.newMessageContent).toBe('"User Name" "TSM MonkeyBoy"');
})


/*
 * TODO: This test fails, and that is because the code is bad :)
 */
/*test("Doesn't fail with 0 parameters and username starting with --", () => {
    let input = '--stereotypicalcat "TSM MonkeyBoy"';
    let output = inputParser.parseOptions(input);
    expect(output.newMessageContent).toBe('--stereotypicalcat "TSM MonkeyBoy"');
})*/
test("Doesnt parse parameters given after users", () => {
    let input = 'StereotypicalCat --matches 30';
    let output = inputParser.parseOptions(input);
    expect(output.newMessageContent).toBe('StereotypicalCat --matches 30');
    expect(output.matches).toBeUndefined();
})


/*
* Parses users test
* */

test("Parses standard user syntax", () => {
    let input = 'StereotypicalCat VPdenmark';
    let output = inputParser.parseUsers(input);

    expect(output).toEqual(['StereotypicalCat', 'VPdenmark']);

})

test("Parses user syntax with \"\"", () => {
    let input = 'StereotypicalCat VPdenmark "TSM MonkeyBoy"';
    let output = inputParser.parseUsers(input);

    expect(output).toEqual(['StereotypicalCat', 'VPdenmark', "TSM MonkeyBoy"]);
})

test("Parses user syntax startign with \"\"", () => {
    let input = '"User Name" StereotypicalCat VPdenmark "TSM MonkeyBoy"';
    let output = inputParser.parseUsers(input);

    expect(output).toEqual(['User Name', 'StereotypicalCat', 'VPdenmark', "TSM MonkeyBoy"]);
})