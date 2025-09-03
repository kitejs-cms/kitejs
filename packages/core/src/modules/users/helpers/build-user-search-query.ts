export function buildUserSearchQuery(filters?: Record<string, any>): Record<string, any> {
  const { search, ...otherFilters } = filters || {};
  const query: Record<string, any> = { ...otherFilters, deletedAt: null };

  if (search && typeof search === 'string' && search.trim()) {
    const searchTerm = search.trim();
    const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);

    if (searchWords.length === 1) {
      const singleWordRegex = new RegExp(searchWords[0], 'i');
      query.$or = [
        { firstName: { $regex: singleWordRegex } },
        { lastName: { $regex: singleWordRegex } },
        { email: { $regex: singleWordRegex } }
      ];
    } else if (searchWords.length >= 2) {
      const [firstWord, secondWord, ...otherWords] = searchWords;
      const firstWordRegex = new RegExp(firstWord, 'i');
      const secondWordRegex = new RegExp(secondWord, 'i');
      const allWordsRegex = searchWords.map(word => new RegExp(word, 'i'));

      query.$or = [
        { firstName: { $regex: new RegExp(searchTerm, 'i') } },
        { lastName: { $regex: new RegExp(searchTerm, 'i') } },
        { email: { $regex: new RegExp(searchTerm, 'i') } },
        {
          $and: [
            { firstName: { $regex: firstWordRegex } },
            { lastName: { $regex: secondWordRegex } }
          ]
        },
        {
          $and: [
            { firstName: { $regex: secondWordRegex } },
            { lastName: { $regex: firstWordRegex } }
          ]
        },
        ...(otherWords.length > 0
          ? [
              {
                $and: allWordsRegex.map(regex => ({
                  $or: [
                    { firstName: { $regex: regex } },
                    { lastName: { $regex: regex } },
                    { email: { $regex: regex } }
                  ]
                }))
              }
            ]
          : []),
        { email: { $regex: new RegExp(searchWords.join('|'), 'i') } }
      ];
    }
  }

  return query;
}

