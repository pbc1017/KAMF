export class NicknameGenerator {
  private static adjectives = [
    '귀여운',
    '멋진',
    '행복한',
    '용감한',
    '똑똑한',
    '친절한',
    '활발한',
    '차분한',
    '재미있는',
    '신비한',
    '빠른',
    '느긋한',
    '밝은',
    '조용한',
    '화려한',
  ];

  private static animals = [
    '강아지',
    '고양이',
    '토끼',
    '다람쥐',
    '햄스터',
    '판다',
    '코알라',
    '펭귄',
    '돌고래',
    '여우',
    '사자',
    '호랑이',
    '곰',
    '늑대',
    '독수리',
  ];

  static generate(): string {
    const adj = this.adjectives[Math.floor(Math.random() * this.adjectives.length)];
    const animal = this.animals[Math.floor(Math.random() * this.animals.length)];
    const number = Math.floor(Math.random() * 1000);
    return `${adj}${animal}${number}`;
  }
}
