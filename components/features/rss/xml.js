import PropTypes from 'fusion:prop-types'
import Consumer from 'fusion:consumer'
import moment from 'moment'
import getProperties from 'fusion:properties'
import { resizerKey } from 'fusion:environment'
import { BuildContent } from '../../../util/contentElements'
import { BuildPromoItems } from '../../../util/feedsPromoItems/promoItems'
import { generatePropsForFeed } from '@wpmedia/feeds-prop-types'
import { buildResizerURL } from '@wpmedia/feeds-resizer'
import URL from 'url'
const jmespath = require('jmespath')
const { decode } = require('he')
const { fragment } = require('xmlbuilder2')

const rssTemplate = (
    elements,
    {
        channelTitle,
        channelDescription,
        channelCopyright,
        channelTTL,
        channelUpdatePeriod,
        channelUpdateFrequency,
        channelCategory,
        channelLogo,
        imageTitle,
        imageCaption,
        imageCredits,
        itemTitle,
        itemDescription,
        pubDate,
        itemCredits,
        itemCategory,
        includePromo,
        includeContent,
        videoSelect,
        requestPath,
        resizerURL,
        resizerWidth,
        resizerHeight,
        promoItemsJmespath,
        domain,
        feedTitle,
        channelLanguage,
        rssBuildContent,
        PromoItems,
        timelineThumbnailJmespath
    },
) => ({
    rss: {
        '@xmlns:atom': 'http://www.w3.org/2005/Atom',
        '@xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
        ...(itemCredits && {
            '@xmlns:dc': 'http://purl.org/dc/elements/1.1/',
        }),
        ...(channelUpdatePeriod &&
            channelUpdatePeriod !== 'Exclude field' && {
            '@xmlns:sy': 'http://purl.org/rss/1.0/modules/syndication/',
        }),
        '@version': '2.0',
        ...(includePromo && {
            '@xmlns:media': 'http://search.yahoo.com/mrss/',
        }),
        channel: {
            title: { $: channelTitle || feedTitle },
            link: `${domain}`,
            'atom:link': {
                '@href': `${domain}${requestPath}`,
                '@rel': 'self',
                '@type': 'application/rss+xml',
            },
            description: { $: channelDescription || `${feedTitle} News Feed` },
            lastBuildDate: moment
                .utc(new Date())
                .format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
            ...(channelLanguage &&
                channelLanguage.toLowerCase() !== 'exclude' && {
                language: channelLanguage,
            }),
            ...(channelCategory && { category: channelCategory }),
            ...(channelCopyright && {
                copyright: channelCopyright,
            }), // TODO Add default logic
            ...(channelTTL && { ttl: channelTTL }),
            ...(channelUpdatePeriod &&
                channelUpdatePeriod !== 'Exclude field' && {
                'sy:updatePeriod': channelUpdatePeriod,
            }),
            ...(channelUpdateFrequency &&
                channelUpdatePeriod !== 'Exclude field' && {
                'sy:updateFrequency': channelUpdateFrequency,
            }),
            ...(channelLogo && {
                image: {
                    url: buildResizerURL(channelLogo, resizerKey, resizerURL),
                    title: channelTitle || feedTitle,
                    link: domain,
                },
            }),

            // the way push alerts works
            // is in the canonical url service
            // there is a rule set up to generate a query param
            // if the label.push_alert.text === "true"
            // but we don't actually need that as a part of the url
            // so we can just use string.replace to remove it
            // because pugpig does not recommend having query params in the urls
            // so for the url, we remove the query param, but to trigger a push, we need to have it
            // the reason it is done this way is because I was never able to easily
            // expose s.label.push_alert.text in the content source
            // I could use source_include in the content source params
            // to actually fetch the label, but the server wouldn't read it
            // and I believe this is because of other queryable fields documentation
            // where only label.basic is expoed

            item: elements.map((s) => {
                let author, body, category
                const url = `${domain}${s.website_url || s.canonical_url || ''}`
                const img = PromoItems.mediaTagPugPig({
                    ans: s,
                    promoItemsJmespath,
                    resizerKey,
                    resizerURL,
                    resizerWidth,
                    resizerHeight,
                    imageTitle,
                    imageCaption,
                    imageCredits,
                    videoSelect,
                })
                const timelineThumbnail = PromoItems.timelineThumbnail({
                    ans: s,
                    promoItemsJmespath: timelineThumbnailJmespath,
                    resizerKey,
                    resizerURL,
                    resizerWidth,
                    resizerHeight,
                    imageTitle,
                    imageCaption,
                    imageCredits,
                    videoSelect,
                })

                // hack for push alerts
                //



                let canPush = s?.taxonomy?.tags?.filter(tag => tag?.slug === "push-alert")?.length > 0


                return {
                    ...(itemTitle && {
                        title: { $: jmespath.search(s, itemTitle) || '' },
                    }),
                    link: url,
                    guid: {
                        '#': s._id,
                        '@isPermaLink': false,
                    },
                    ...(itemCredits &&
                        (author = jmespath.search(s, itemCredits)) &&
                        author.length && {
                        'dc:creator': { $: author.join(', ') },
                    }),
                    ...(itemDescription && {
                        description: { $: jmespath.search(s, itemDescription) || '' },
                    }),
                    pubDate: moment
                        .utc(s[pubDate])
                        .format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
                    "atom:updated": moment
                        .utc(s.last_updated_date)
                        .format('YYYY-MM-DDTHH:mm:ss[Z]'),
                    ...(itemCategory &&
                        (category = jmespath.search(s, itemCategory)) &&
                        category && { primary_category: { $: category } }),
                    category: s.taxonomy.sections.map((section) => {

                        return {
                            $: section.name,
                            '@domain': section._id
                        }
                    }),
                    ...(includeContent !== 0 &&
                        (body = rssBuildContent.parse(
                            s.content_elements || [],
                            includeContent,
                            domain,
                            resizerKey,
                            resizerURL,
                            600,
                            0,
                            videoSelect,
                        )) &&
                        body && {
                        'content:encoded': {
                            $0: (s.subheadlines?.basic ? `<h2>${s.subheadlines.basic}</h2>` : ''),
                            $1: (includePromo && img && img?.length > 1 ? decode(fragment(img).toString()) : ''),
                            $2: body,
                        },
                    }),
                    ...(includePromo && timelineThumbnail && { '#1': timelineThumbnail }),
                    // ...(includePromo && img && { '#2': img }),
                    ...(includePromo && img && img.length < 2 && { '#2': img }),
                    // ...(s?.promo_items?.lead_art?.type==='video' && { lead_video_embed: { $: s.promo_items.lead_art.embed_html }}),
                    ...(s?.promo_items?.lead_art?.type === 'video' && { lead_video_id: s.promo_items.lead_art._id }),
                    pugpig_post_allow_automated_push: (canPush ? 1 : 0),
                }
            }),
        },
    },
})

export function Rss({ globalContent, customFields, arcSite, requestUri }) {
    const {
        resizerURL = '',
        feedDomainURL = 'http://localhost.com',
        feedTitle = '',
        feedLanguage = '',
    } = getProperties(arcSite)
    const channelLanguage = customFields.channelLanguage || feedLanguage
    const { width = 0, height = 0 } = customFields.resizerKVP || {}
    const requestPath = new URL.URL(requestUri, feedDomainURL).pathname

    const PromoItems = new BuildPromoItems()
    const rssBuildContent = new BuildContent()

    // can't return null for xml return type, must return valid xml template
    return rssTemplate(globalContent.content_elements || [], {
        ...customFields,
        requestPath,
        resizerURL,
        resizerWidth: width,
        resizerHeight: height,
        domain: feedDomainURL,
        feedTitle,
        channelLanguage,
        rssBuildContent,
        PromoItems,
    })
}

Rss.propTypes = {
    customFields: PropTypes.shape({
        ...generatePropsForFeed('rss', PropTypes),
        timelineThumbnailJmespath: PropTypes.string.tag({
            label: 'Path to timeline PromoItem override',
            group: 'Featured Media',
            description:
                'ANS fields to use for timeline featured media override, defaults to promo_items.basic',
            defaultValue: 'promo_items.basic',
        })
    }),
}
Rss.label = 'RSS Standard - 910'
Rss.icon = 'arc-rss'
export default Consumer(Rss)
