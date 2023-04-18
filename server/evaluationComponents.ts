import cheerio, { AnyNode, BasicAcceptedElems, CheerioAPI, Element } from 'cheerio';
import * as ApiTypes from '../shared/apiTypes';

type Scraper<T> = ($: CheerioAPI, el: BasicAcceptedElems<AnyNode>) => T;

const getResponseRate: Scraper<ApiTypes.CourseResponseRate> = ($, el) => {
    const nums = $(el)
        .find('tbody td')
        .toArray()
        .map((td) => parseInt($(td).text().trim(), 10));
    if (nums.length !== 3) {
        throw new Error('Could not read course participation');
    }
    const [responded, invited] = nums;
    return { responded, invited };
};

// gets the votes in descending order, i.e. excellent, then very good, etc., down to unsatisfactory
// same way it shows up in the q guide
const getGeneralQuestions: Scraper<ApiTypes.CourseGeneralQuestions> = ($, el) => $(el)
    .find('tbody tr')
    .toArray()
    .reduce((acc, tr) => {
        const row = $(tr)
            .children()
            .toArray()
            .map((child) => $(child).text().trim());
        if (row.length !== 9) {
            throw new Error('Could not read course feedback');
        }

        const title = row[0];
        const count = parseInt(row[1], 10);
        const votes = row
            .slice(2, 7)
            .map((v) => Math.round((parseInt(v, 10) * count) / 100));
        const courseMean = parseFloat(row[7]);
        const fasMean = parseFloat(row[8]);
        const ret: ApiTypes.CourseGeneralQuestions = {
            ...acc,
            [title]: {
                count,
                votes,
                courseMean,
                fasMean,
            },
        };
        return ret;
    }, {} as ApiTypes.CourseGeneralQuestions);

const getRecommendations: Scraper<ApiTypes.RecommendationsStats> = ($, el) => {
    const tables = $(el).find('tbody');
    if (tables.length !== 2) throw new Error('Could not read recommendations');

    const recommendations = tables
        .first()
        .children() // trs
        .toArray()
        .map((tr) => {
            const row = $(tr)
                .children() // td
                .toArray()
                .map((td) => $(td).text().trim());
            if (row.length !== 4) {
                throw new Error('Could not read recommendations');
            }
            return parseInt(row[2], 10);
        });
    const count = recommendations.reduce((acc, val) => acc + val, 0);

    const stats = tables
        .last()
        .find('td')
        .toArray()
        .map((td) => parseFloat($(td).text().trim().replace('%', '')));

    if (stats.length === 5) {
        const [ratio, mean, median, , stdev] = stats;
        return {
            recommendations,
            count,
            ratio,
            mean,
            median,
            stdev,
        };
    }

    if (stats.length !== 4) {
        throw new Error('Could not read recommendation statistics');
    }
    const [ratio, mean, median, stdev] = stats;
    return {
        recommendations,
        count,
        ratio,
        mean,
        median,
        stdev,
    };
};

const getHours: Scraper<ApiTypes.HoursStats> = ($, el) => {
    const nums = $(el)
        .find('tbody td')
        .map((_, td) => parseFloat($(td).text().trim().replace('%', '')))
        .toArray();
    if (nums.length !== 6) {
        throw new Error('Could not read course hours');
    }
    const [count, ratio, mean, median, mode, stdev] = nums;
    return {
        count,
        ratio,
        mean,
        median,
        mode,
        stdev,
    };
};

const getReasons: Scraper<ApiTypes.ReasonsForEnrolling> = ($, el) => {
    const nums = $(el)
        .find('tbody td')
        .map((_, td) => parseInt($(td).text().trim(), 10))
        .toArray();

    if (nums.length !== 9) {
        throw new Error('Could not read reasons for enrolling');
    }
    const [
        elective,
        concentration,
        secondary,
        gened,
        expos,
        language,
        premed,
        distribution,
        qrd,
    ] = nums;
    return {
        elective,
        concentration,
        secondary,
        gened,
        expos,
        language,
        premed,
        distribution,
        qrd,
    };
};

const getComments: Scraper<string[]> = ($, el) => $(el)
    .find('tbody td')
    .map((_, td) => $(td).text().trim())
    .toArray();

export const commentsSectionTitle = 'What would you like to tell future students about this class?';

export const altCommentsSectionTitle = 'What would you like to tell future students about this class? (Your response to this question may be published anonymously.)';

export const COMPONENT_MAPPING = {
    'Course General Questions': getGeneralQuestions,
    'General Instructor Questions': getGeneralQuestions,
    'Course Response Rate': getResponseRate,
    'On average, how many hours per week did you spend on coursework outside of class? Enter a whole number between 0 and 168.': getHours,
    'How strongly would you recommend this course to your peers?': getRecommendations,
    'What was/were your reason(s) for enrolling in this course? (Please check all that apply)': getReasons,
    [commentsSectionTitle]: getComments,
} as const;

