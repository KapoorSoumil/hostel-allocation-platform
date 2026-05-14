type RankableStudent = {
  id: string;
  cgpa: number;
};

export function assignCgpaRanks<T extends RankableStudent>(students: T[]) {
  return [...students]
    .sort((a, b) => b.cgpa - a.cgpa || a.id.localeCompare(b.id))
    .map((student, index) => ({
      ...student,
      rank: index + 1
    }));
}
