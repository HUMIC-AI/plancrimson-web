import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { ExtendedClass } from '../../src/lib';

const openai = new OpenAI();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string; }>,
) {
  try {
    const { src, tgt } = req.body as { src: ExtendedClass; tgt: ExtendedClass };

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a lively advisor working at Harvard College. You\'re very knowledgeable about the courses offered at Harvard. A student has come to you with two courses they want to compare. Provide a brief and insightful response. Avoid summarizing the courses individually; instead, compare them to each other. Be kind and encouraging! Ask whimsical, thought-provoking questions. Be brief and concise!',
        },
        {
          role: 'user',
          content: `Compare these two courses:

${src.HU_SUBJ_CATLG_NBR}: ${src.Title} (taught by ${src.IS_SCL_DESCR_IS_SCL_DESCRL})${src.meanHours && ` - average ${src.meanHours} hours per week`}
${src.textDescription}

${tgt.HU_SUBJ_CATLG_NBR}: ${tgt.Title} (taught by ${tgt.IS_SCL_DESCR_IS_SCL_DESCRL})${tgt.meanHours && ` - average ${tgt.meanHours} hours per week`}
${tgt.textDescription}`,
        },
      ],
    });

    //   console.log(completion.choices[0]);
    res.status(200).json({ message: completion.choices[0].message.content! });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
}
